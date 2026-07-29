/**
 * GET/PATCH /api/admin/payments/[id] — one payment, and the human decision on it.
 *
 * Verifying is the moment a claim becomes money: nothing in the system checks a
 * bank balance, so a person opens the screenshot, finds the transfer, and says
 * so here. The decision lands on the lead's timeline because that is where the
 * team looks when a customer rings up about their booking.
 */

import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { quotes } from '@/db/schema';
import { AdminRouteError, handleAdminRoute } from '@/lib/auth/require-admin';
import { truncate } from '@/lib/crm/normalize';
import { getPaymentDetail, reviewPayment } from '@/lib/crm/payments';
import { quoteReference } from '@/lib/crm/quotes';
import {
  buildTemplateContext,
  loadOpportunityWithContact,
  logActivity,
  paymentSummaryForQuote,
} from '@/lib/crm/repository';
import { deliverMessage } from '@/lib/messaging';
import { paymentMethodLabel } from '@/data/payment-methods';
import { reviewPaymentSchema } from '@/models/payment.schema';
import { quoteTypeLabel } from '@/models/quote.schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  return handleAdminRoute(async () => {
    const payment = await getPaymentDetail(id);
    if (!payment) throw new AdminRouteError('Payment not found', 404);
    return payment;
  });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  return handleAdminRoute(async (admin) => {
    const parsed = reviewPaymentSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      throw new AdminRouteError('Choose verify or reject', 400);
    }

    const payment = await reviewPayment({
      paymentId: id,
      action: parsed.data.action,
      note: parsed.data.note,
      adminUserId: admin.id,
    });

    if (!payment) throw new AdminRouteError('Payment not found', 404);

    const [quote] = await db.select().from(quotes).where(eq(quotes.id, payment.quoteId)).limit(1);
    const verified = parsed.data.action === 'verify';

    // Verifying is the first time anyone can honestly tell the customer their
    // money arrived, so that is when they hear from us — and the email has to
    // say whether this settled the booking or was one instalment of it.
    let customerNotified = false;
    if (verified && quote) {
      try {
        const loaded = await loadOpportunityWithContact(payment.opportunityId);
        if (loaded?.contact.email) {
          const context = await buildTemplateContext(loaded.opportunity, loaded.contact);
          const result = await deliverMessage({
            channel: 'email',
            template: 'payment_verified',
            context: {
              ...context,
              // Always this payment's quote, which on a split booking is not
              // necessarily the most recent one settled.
              payment: await paymentSummaryForQuote(quote),
            },
            audience: 'customer',
          });

          customerNotified = result.delivered;

          await logActivity({
            opportunityId: payment.opportunityId,
            contactId: payment.contactId,
            adminUserId: admin.id,
            type: 'message_out',
            channel: 'email',
            subject: result.subject,
            body: truncate(result.body, 2000),
            metadata: {
              template: 'payment_verified',
              paymentId: payment.id,
              delivered: result.delivered,
              provider: result.provider,
              error: result.error ?? null,
            },
          });

          if (result.error) console.error('[payments] verified email failed:', result.error);
        }
      } catch (error) {
        // The decision is already recorded; a mail problem must not undo it.
        console.error('[payments] could not send the verified email:', error);
      }
    }

    await logActivity({
      opportunityId: payment.opportunityId,
      contactId: payment.contactId,
      adminUserId: admin.id,
      type: 'note',
      subject: `Payment ${verified ? 'verified' : 'rejected'} — ${payment.currency} ${
        payment.amount
      } via ${paymentMethodLabel(payment.method)}`,
      body: [
        quote ? `Quote: ${quoteReference(quote.id)} (${quoteTypeLabel(quote.quoteType)})` : null,
        payment.reference ? `Customer reference: ${payment.reference}` : null,
        verified
          ? customerNotified
            ? 'The customer has been emailed that their payment is accepted.'
            : 'Note: the customer was not emailed — check they have an address on file.'
          : null,
        parsed.data.note?.trim() || null,
      ]
        .filter(Boolean)
        .join('\n') || null,
      metadata: {
        paymentId: payment.id,
        quoteId: payment.quoteId,
        status: payment.status,
      },
    });

    return { success: true as const, status: payment.status, customerNotified };
  });
}
