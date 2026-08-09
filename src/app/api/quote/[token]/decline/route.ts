/**
 * POST /api/quote/[token]/decline — the customer says no.
 *
 * Worth capturing rather than letting the quote rot: a recorded reason feeds
 * the dashboard's "Why deals died" panel, which is the only way to find out
 * whether you are losing on price, dates, or speed.
 */

import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { quotes } from '@/db/schema';
import { releaseCreditsForQuote } from '@/lib/crm/credits';
import {
  hasAcceptedQuote,
  quoteReference,
  resolveQuoteByToken,
  syncOpportunityValue,
} from '@/lib/crm/quotes';
import { loadOpportunityWithContact, logActivity } from '@/lib/crm/repository';
import { moveStage } from '@/lib/workflows/engine';
import { declineQuoteSchema } from '@/models/quote.schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;

  const parsed = declineQuoteSchema.safeParse(await request.json().catch(() => ({})));
  const reason = parsed.success ? parsed.data.reason?.trim() : undefined;

  try {
    const resolved = await resolveQuoteByToken(token);
    if (!resolved) {
      return NextResponse.json({ message: 'This quote link is not valid' }, { status: 404 });
    }

    const { quote } = resolved;

    if (quote.status === 'accepted') {
      return NextResponse.json(
        { message: 'This quote was already accepted. Message us if you need to change it.' },
        { status: 409 }
      );
    }

    const now = new Date();
    await db
      .update(quotes)
      .set({
        status: 'declined',
        declinedAt: now,
        updatedAt: now,
        declineReason: reason || 'No reason given',
      })
      .where(eq(quotes.id, quote.id));

    // They said no, so they did not spend their referral credit. Handing it
    // back is what lets them use it on the price we quote them next.
    const creditsReleased = await releaseCreditsForQuote(quote.id).catch((error) => {
      console.error('[quote] credit release failed:', error);
      return 0;
    });

    await logActivity({
      opportunityId: quote.opportunityId,
      contactId: quote.contactId,
      type: 'message_in',
      channel: 'system',
      subject: `Customer declined quote ${quoteReference(quote.id)}`,
      body: [
        reason || null,
        creditsReleased > 0
          ? `${creditsReleased} referral credit${creditsReleased === 1 ? '' : 's'} returned to the customer.`
          : null,
      ]
        .filter(Boolean)
        .join('\n') || null,
      metadata: { quoteId: quote.id, creditsReleased },
    });

    // The declined price stops counting toward the forecast.
    await syncOpportunityValue(quote.opportunityId);

    const loaded = await loadOpportunityWithContact(quote.opportunityId);

    // Turning down a quote normally means the deal is dead — but not when the
    // customer has already paid one on this booking. Declining the balance of a
    // split payment is a conversation to have, not a lost deal.
    const partPaid = await hasAcceptedQuote(quote.opportunityId);

    if (loaded && !partPaid) {
      await moveStage({
        opportunity: loaded.opportunity,
        contact: loaded.contact,
        stage: 'lost',
        lostReason: reason ? `Declined quote: ${reason}` : 'Customer declined the quote',
        actor: 'Customer (declined quote)',
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[quote] decline failed:', error);
    return NextResponse.json({ message: 'Could not record that' }, { status: 500 });
  }
}
