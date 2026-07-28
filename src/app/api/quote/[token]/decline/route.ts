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
import { quoteReference, resolveQuoteByToken } from '@/lib/crm/quotes';
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

    await logActivity({
      opportunityId: quote.opportunityId,
      contactId: quote.contactId,
      type: 'message_in',
      channel: 'system',
      subject: `Customer declined quote ${quoteReference(quote.id)}`,
      body: reason || null,
      metadata: { quoteId: quote.id },
    });

    const loaded = await loadOpportunityWithContact(quote.opportunityId);
    if (loaded) {
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
