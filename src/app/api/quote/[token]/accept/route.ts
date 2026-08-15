/**
 * POST /api/quote/[token]/accept — the customer confirms the booking.
 *
 * This is the moment a lead becomes revenue: the quote is accepted, the deal
 * moves to **Booked**, and W4 (confirmation → trip reminder → review → referral)
 * takes over. The stage move goes through `moveStage()` so a referral converting
 * here still triggers W5.
 *
 * Two emails leave on this request: the customer's booking confirmation (their
 * receipt) and the team's alert (go check the payment and assign a driver).
 * Neither is allowed to fail the booking — the money and the deal are already
 * committed by the time they are sent.
 */

import { NextResponse } from 'next/server';
import { and, eq, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { activities, opportunities, quotes } from '@/db/schema';
import { redeemCreditsForQuote } from '@/lib/crm/credits';
import { truncate } from '@/lib/crm/normalize';
import {
  ProofRejectedError,
  prepareProof,
  recordPayment,
  type ProofUpload,
} from '@/lib/crm/payments';
import {
  isQuoteExpired,
  quoteReference,
  resolveQuoteByToken,
  syncOpportunityValue,
} from '@/lib/crm/quotes';
import { buildTemplateContext, loadOpportunityWithContact, logActivity } from '@/lib/crm/repository';
import { deliverMessage, type TemplateContext } from '@/lib/messaging';
import { moveStage } from '@/lib/workflows/engine';
import { getPaymentMethod } from '@/data/payment-methods';
import { acceptQuoteSchema } from '@/models/quote.schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * How many booking confirmations this deal has on its timeline.
 *
 * Counted either side of the stage move to see whether W4 sent one: the
 * workflow runs synchronously inside `moveStage`, so anything it sent is
 * already recorded by the time we count again. Comparing counts rather than
 * timestamps keeps this exact when a deal is paid in instalments — an earlier
 * payment's receipt must not suppress this one's.
 */
async function countBookingConfirmations(opportunityId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(activities)
    .where(
      and(
        eq(activities.opportunityId, opportunityId),
        eq(activities.type, 'message_out'),
        sql`${activities.metadata} ->> 'template' = 'booking_confirmation'`
      )
    );

  return row?.count ?? 0;
}

/** Sends one booking email and records it on the deal's timeline. */
async function sendBookingEmail(params: {
  template: 'booking_confirmation' | 'payment_submitted';
  audience: 'customer' | 'admin';
  context: TemplateContext;
  opportunityId: string;
  contactId: string;
  quoteId: string;
}): Promise<void> {
  const result = await deliverMessage({
    channel: 'email',
    template: params.template,
    context: params.context,
    audience: params.audience,
  });

  if (result.error) {
    console.error(`[quote] ${params.template} email failed:`, result.error);
  }

  await logActivity({
    opportunityId: params.opportunityId,
    contactId: params.contactId,
    type: params.audience === 'admin' ? 'workflow' : 'message_out',
    channel: 'email',
    subject:
      params.audience === 'admin'
        ? `Payment alert sent to the team · ${result.subject}`
        : result.subject,
    body: truncate(result.body, 2000),
    metadata: {
      template: params.template,
      quoteId: params.quoteId,
      delivered: result.delivered,
      provider: result.provider,
      error: result.error ?? null,
    },
  });
}

/**
 * The checkout page posts multipart form data when the customer attaches a
 * screenshot, and plain JSON when they don't. Reading both keeps the payload
 * honest either way rather than forcing every confirmation through multipart.
 */
async function readSubmission(request: Request): Promise<{
  fields: unknown;
  proofFile: File | null;
}> {
  const contentType = request.headers.get('content-type') ?? '';

  if (!contentType.includes('multipart/form-data')) {
    return { fields: await request.json().catch(() => null), proofFile: null };
  }

  const form = await request.formData();
  const proof = form.get('proofOfPayment');

  return {
    fields: {
      paymentMethod: String(form.get('paymentMethod') ?? ''),
      paymentReference: String(form.get('paymentReference') ?? '') || undefined,
      paymentNote: String(form.get('paymentNote') ?? '') || undefined,
    },
    proofFile: proof instanceof File && proof.size > 0 ? proof : null,
  };
}

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;

  const submission = await readSubmission(request).catch(() => null);
  if (!submission) {
    return NextResponse.json({ message: 'We could not read that submission' }, { status: 400 });
  }

  const parsed = acceptQuoteSchema.safeParse(submission.fields);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Choose how you would like to pay' }, { status: 400 });
  }

  const method = getPaymentMethod(parsed.data.paymentMethod);
  if (!method) {
    return NextResponse.json({ message: 'That payment method is not available' }, { status: 400 });
  }

  /**
   * What the method asks for, enforced here and not only in the browser.
   *
   * The checkout page disables the confirm button, but the token is the whole
   * authentication on this endpoint — anyone holding the link can post to it
   * directly. Without these two checks a transfer could be booked with no
   * receipt to match, and a cash booking with no idea when the money is coming.
   */
  const paymentNote = parsed.data.paymentNote?.trim() || null;

  if (method.requiresProof && !submission.proofFile) {
    return NextResponse.json(
      { message: 'Please attach a screenshot of your payment so we can confirm it' },
      { status: 400 }
    );
  }

  if (method.requiresPaymentNote && !paymentNote) {
    return NextResponse.json(
      { message: 'Please tell us when you plan to pay' },
      { status: 400 }
    );
  }

  // Validate the screenshot before anything is written: a rejected image must
  // leave the quote untouched so the customer can retry on the same link.
  let proof: ProofUpload | null = null;
  if (submission.proofFile) {
    try {
      proof = await prepareProof(submission.proofFile, submission.proofFile.name);
    } catch (error) {
      if (error instanceof ProofRejectedError) {
        return NextResponse.json({ message: error.message }, { status: 400 });
      }
      console.error('[quote] proof upload failed:', error);
      return NextResponse.json(
        { message: 'We could not read that image. Please try another screenshot.' },
        { status: 400 }
      );
    }
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
        paymentNote,
      })
      .where(eq(quotes.id, quote.id));

    // The one moment a reserved referral credit is actually spent. Anything
    // that happens after this is about a booking that already exists, so a
    // failure here must not be able to un-accept it — hence the catch.
    const creditsSpent = await redeemCreditsForQuote(quote.id).catch((error) => {
      console.error('[quote] credit redemption failed:', error);
      return 0;
    });

    const loaded = await loadOpportunityWithContact(quote.opportunityId);
    if (!loaded) {
      return NextResponse.json({ message: 'Could not confirm this booking' }, { status: 500 });
    }

    // The payment record is what /admin/payments works from — one row per
    // settlement attempt, holding the screenshot and awaiting a human check.
    const payment = await recordPayment({
      quoteId: quote.id,
      opportunityId: quote.opportunityId,
      contactId: quote.contactId,
      amount: quote.total,
      currency: quote.currency,
      method: method.key,
      reference: parsed.data.paymentReference,
      proof,
    });

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
        paymentNote ? `When they'll pay: ${paymentNote}` : null,
        proof ? 'Proof of payment: screenshot attached' : 'Proof of payment: none attached',
        creditsSpent > 0
          ? `Referral credit spent: ${creditsSpent} credit${creditsSpent === 1 ? '' : 's'}`
          : null,
      ]
        .filter(Boolean)
        .join('\n'),
      metadata: {
        quoteId: quote.id,
        paymentId: payment.id,
        paymentMethod: method.key,
        paymentReference: parsed.data.paymentReference ?? null,
        paymentNote,
        proofAttached: Boolean(proof),
        creditsSpent,
      },
    });

    // Make sure the deal value reflects what they actually agreed to — every
    // live quote on the deal, since a booking can be split across payments.
    await syncOpportunityValue(quote.opportunityId);

    const [refreshed] = await db
      .select()
      .from(opportunities)
      .where(eq(opportunities.id, quote.opportunityId))
      .limit(1);

    const confirmationsBefore = await countBookingConfirmations(quote.opportunityId);

    if (refreshed) {
      await moveStage({
        opportunity: refreshed,
        contact: loaded.contact,
        stage: 'booked',
        actor: 'Customer (accepted quote)',
      });
    }

    // Built from the refreshed deal so both emails quote the amount the
    // customer actually agreed to, along with how they chose to pay it.
    const templateContext = await buildTemplateContext(
      refreshed ?? loaded.opportunity,
      loaded.contact
    );

    try {
      // The customer's receipt. Normally W4 sends it the instant the deal hits
      // Booked; this covers the cases where it can't — the automation being
      // switched off, or the deal already sitting at Booked (the second
      // instalment of a split payment) so no stage change fired. Every payment
      // gets confirmed in writing.
      if ((await countBookingConfirmations(quote.opportunityId)) === confirmationsBefore) {
        await sendBookingEmail({
          template: 'booking_confirmation',
          audience: 'customer',
          context: templateContext,
          opportunityId: quote.opportunityId,
          contactId: quote.contactId,
          quoteId: quote.id,
        });
      }

      // And the team's copy — someone has to check the money landed before a
      // vehicle is committed.
      await sendBookingEmail({
        template: 'payment_submitted',
        audience: 'admin',
        context: templateContext,
        opportunityId: quote.opportunityId,
        contactId: quote.contactId,
        quoteId: quote.id,
      });
    } catch (error) {
      // The booking is committed; a mail problem must not tell the customer it failed.
      console.error('[quote] booking emails failed:', error);
    }

    return NextResponse.json({ success: true, alreadyAccepted: false });
  } catch (error) {
    console.error('[quote] accept failed:', error);
    return NextResponse.json({ message: 'Could not confirm this booking' }, { status: 500 });
  }
}
