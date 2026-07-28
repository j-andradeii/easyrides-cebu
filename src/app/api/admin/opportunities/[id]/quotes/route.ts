/**
 * POST /api/admin/opportunities/[id]/quotes — build and send a quote.
 *
 * Creating a quote is how a lead reaches **Quote Sent**: the stage move happens
 * here rather than being a separate click, so the funnel can never claim a
 * quote was sent when no customer ever received a link.
 */

import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { opportunities } from '@/db/schema';
import { AdminRouteError, handleAdminRoute } from '@/lib/auth/require-admin';
import { createQuote, listQuotesForOpportunity } from '@/lib/crm/quotes';
import { loadOpportunityWithContact } from '@/lib/crm/repository';
import { getStageByKey } from '@/lib/crm/repository';
import { moveStage } from '@/lib/workflows/engine';
import { createQuoteSchema } from '@/models/quote.schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

    const { quote, url } = await createQuote({
      opportunityId: id,
      input: parsed.data,
      adminUserId: admin.id,
      adminName: admin.name,
    });

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

    return {
      success: true as const,
      quoteId: quote.id,
      token: quote.token,
      url,
      notify: parsed.data.notify,
    };
  });
}
