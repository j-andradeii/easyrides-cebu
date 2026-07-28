/**
 * POST /api/quote/[token]/accept — the customer confirms the booking.
 *
 * This is the moment a lead becomes revenue: the quote is accepted, the deal
 * moves to **Booked**, and W4 (confirmation → trip reminder → review → referral)
 * takes over. The stage move goes through `moveStage()` so a referral converting
 * here still triggers W5.
 */

import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { opportunities, quotes } from '@/db/schema';
import { isQuoteExpired, quoteReference, resolveQuoteByToken } from '@/lib/crm/quotes';
import { buildTemplateContext, loadOpportunityWithContact, logActivity } from '@/lib/crm/repository';
import { deliverMessage } from '@/lib/messaging';
import { moveStage } from '@/lib/workflows/engine';
import { getPaymentMethod } from '@/data/payment-methods';
import { acceptQuoteSchema } from '@/models/quote.schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;

  const parsed = acceptQuoteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: 'Choose how you would like to pay' }, { status: 400 });
  }

  const method = getPaymentMethod(parsed.data.paymentMethod);
  if (!method) {
    return NextResponse.json({ message: 'That payment method is not available' }, { status: 400 });
  }

  try {
    const resolved = await resolveQuoteByToken(token);
    if (!resolved) {
      return NextResponse.json({ message: 'This quote link is not valid' }, { status: 404 });
    }

    const { quote } = resolved;

    // Accepting twice is a double-tap, not an error — return the same success.
    if (quote.status === 'accepted') {
      return NextResponse.json({ success: true, alreadyAccepted: true });
    }

    if (quote.status === 'cancelled') {
      return NextResponse.json(
        { message: 'This quote was replaced by a newer one. Please check your latest link.' },
        { status: 409 }
      );
    }

    if (isQuoteExpired(quote)) {
      return NextResponse.json(
        { message: 'This quote has expired. Message us and we will send you a fresh price.' },
        { status: 410 }
      );
    }

    const now = new Date();
    await db
      .update(quotes)
      .set({
        status: 'accepted',
        acceptedAt: now,
        updatedAt: now,
        paymentMethod: method.key,
        paymentReference: parsed.data.paymentReference?.trim() || null,
      })
      .where(eq(quotes.id, quote.id));

    const loaded = await loadOpportunityWithContact(quote.opportunityId);
    if (!loaded) {
      return NextResponse.json({ message: 'Could not confirm this booking' }, { status: 500 });
    }

    await logActivity({
      opportunityId: quote.opportunityId,
      contactId: quote.contactId,
      type: 'message_in',
      channel: 'system',
      subject: `Customer accepted quote ${quoteReference(quote.id)}`,
      body: [
        `Total: ${quote.currency} ${quote.total}`,
        `Payment method: ${method.label}`,
        parsed.data.paymentReference ? `Reference: ${parsed.data.paymentReference}` : null,
      ]
        .filter(Boolean)
        .join('\n'),
      metadata: {
        quoteId: quote.id,
        paymentMethod: method.key,
        paymentReference: parsed.data.paymentReference ?? null,
      },
    });

    // Make sure the deal value reflects what they actually agreed to.
    await db
      .update(opportunities)
      .set({ monetaryValue: quote.total, updatedAt: now })
      .where(eq(opportunities.id, quote.opportunityId));

    const [refreshed] = await db
      .select()
      .from(opportunities)
      .where(eq(opportunities.id, quote.opportunityId))
      .limit(1);

    if (refreshed) {
      await moveStage({
        opportunity: refreshed,
        contact: loaded.contact,
        stage: 'booked',
        actor: 'Customer (accepted quote)',
      });
    }

    // Tell the team a booking just landed — they need to assign a driver.
    const templateContext = await buildTemplateContext(loaded.opportunity, loaded.contact);
    await deliverMessage({
      channel: 'email',
      template: 'new_lead_alert',
      context: {
        ...templateContext,
        opportunityTitle: `BOOKED — ${templateContext.opportunityTitle} (${method.label})`,
      },
      audience: 'admin',
    }).catch((error) => console.error('[quote] admin booking alert failed:', error));

    return NextResponse.json({ success: true, alreadyAccepted: false });
  } catch (error) {
    console.error('[quote] accept failed:', error);
    return NextResponse.json({ message: 'Could not confirm this booking' }, { status: 500 });
  }
}
