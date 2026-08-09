/**
 * POST /api/admin/opportunities/[id]/quotes — build and send a quote.
 *
 * Creating a quote is how a lead reaches **Quote Sent**: the stage move happens
 * here rather than being a separate click, so the funnel can never claim a
 * quote was sent when no customer ever received a link.
 *
 * "Send" means send: the quote is emailed to the contact from this request, not
 * left for an automation to pick up. W3 also mails the link when a *new* lead
 * moves to Quote Sent, so this checks the timeline and stays quiet if the
 * workflow already did it — the customer must never get the same quote twice.
 */

import { and, desc, eq, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { activities, opportunities } from '@/db/schema';
import { AdminRouteError, handleAdminRoute } from '@/lib/auth/require-admin';
import { truncate } from '@/lib/crm/normalize';
import { createQuote, listQuotesForOpportunity, quoteReference } from '@/lib/crm/quotes';
import { buildTemplateContext, loadOpportunityWithContact, logActivity } from '@/lib/crm/repository';
import { getStageByKey } from '@/lib/crm/repository';
import { deliverMessage } from '@/lib/messaging';
import { moveStage } from '@/lib/workflows/engine';
import { createQuoteSchema } from '@/models/quote.schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const QUOTE_EMAIL_MATCH = sql`${activities.metadata} ->> 'template' = 'quote_summary'`;

/** How many quote emails this deal has on its timeline. */
async function countQuoteEmails(opportunityId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(activities)
    .where(
      and(
        eq(activities.opportunityId, opportunityId),
        eq(activities.type, 'message_out'),
        QUOTE_EMAIL_MATCH
      )
    );

  return row?.count ?? 0;
}

/**
 * Whether the last quote email actually left the building. Read from the
 * timeline so this route can report honestly on a send W3 made — "emailed"
 * has to mean delivered, not "an activity exists".
 */
async function lastQuoteEmailOutcome(
  opportunityId: string
): Promise<{ delivered: boolean; error: string | null }> {
  const [row] = await db
    .select({ metadata: activities.metadata })
    .from(activities)
    .where(
      and(
        eq(activities.opportunityId, opportunityId),
        eq(activities.type, 'message_out'),
        QUOTE_EMAIL_MATCH
      )
    )
    .orderBy(desc(activities.createdAt))
    .limit(1);

  const metadata = (row?.metadata ?? {}) as Record<string, unknown>;
  return {
    delivered: metadata.delivered === true,
    error: typeof metadata.error === 'string' ? metadata.error : null,
  };
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return handleAdminRoute(async () => ({ items: await listQuotesForOpportunity(id) }));
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  return handleAdminRoute(async (admin) => {
    const parsed = createQuoteSchema.safeParse(await request.json().catch(() => null));

    if (!parsed.success) {
      throw new AdminRouteError(
        parsed.error.issues[0]?.message ?? 'Invalid quote',
        400
      );
    }

    const loaded = await loadOpportunityWithContact(id);
    if (!loaded) throw new AdminRouteError('Inquiry not found', 404);

    if (loaded.opportunity.status === 'lost') {
      throw new AdminRouteError(
        'This lead is marked Lost. Reopen it before sending a quote.',
        400
      );
    }

    const { quote, url, creditApplied } = await createQuote({
      opportunityId: id,
      input: parsed.data,
      adminUserId: admin.id,
      adminName: admin.name,
    });

    const emailsBefore = await countQuoteEmails(id);

    // Advance the deal, which enrolls W3 (quote → booking follow-ups).
    const newLeadStage = await getStageByKey('new_lead');
    if (loaded.opportunity.stageId === newLeadStage.id) {
      const [refreshed] = await db
        .select()
        .from(opportunities)
        .where(eq(opportunities.id, id))
        .limit(1);

      if (refreshed) {
        await moveStage({
          opportunity: refreshed,
          contact: loaded.contact,
          stage: 'quote_sent',
          adminUserId: admin.id,
          actor: admin.name,
        });
      }
    }

    // Email the customer their link. W3 covers the new-lead path; this covers
    // every other one — a follow-up price, or the next instalment of a booking
    // that is already past Quote Sent.
    let emailed = false;
    let emailError: string | null = null;

    if (parsed.data.notify) {
      if ((await countQuoteEmails(id)) > emailsBefore) {
        // W3 just sent it. Report what actually happened to that send rather
        // than assuming it landed.
        const outcome = await lastQuoteEmailOutcome(id);
        emailed = outcome.delivered;
        emailError = outcome.error;
      } else if (!loaded.contact.email) {
        emailError = 'This contact has no email address — send them the link yourself.';
      } else {
        const context = await buildTemplateContext(loaded.opportunity, loaded.contact);
        const result = await deliverMessage({
          channel: 'email',
          template: 'quote_summary',
          context,
          audience: 'customer',
        });

        emailed = result.delivered;
        emailError = result.error ?? null;

        await logActivity({
          opportunityId: id,
          contactId: loaded.contact.id,
          adminUserId: admin.id,
          type: 'message_out',
          channel: 'email',
          subject: `Quote ${quoteReference(quote.id)} emailed to ${loaded.contact.email}`,
          body: truncate(result.body, 2000),
          metadata: {
            template: 'quote_summary',
            quoteId: quote.id,
            delivered: result.delivered,
            provider: result.provider,
            error: result.error ?? null,
          },
        });

        if (result.error) {
          console.error('[quotes] quote email failed:', result.error);
        }
      }
    }

    return {
      success: true as const,
      quoteId: quote.id,
      token: quote.token,
      url,
      notify: parsed.data.notify,
      emailed,
      emailedTo: emailed ? loaded.contact.email : null,
      // Trimmed for the toast — the provider's full complaint is on the timeline.
      emailError: emailError ? truncate(emailError, 140) : null,
      creditApplied,
    };
  });
}
