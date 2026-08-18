/**
 * Payment contracts — what a customer submits when they settle a quote, and
 * what the admin portal shows back.
 *
 * A payment is a *claim*, not a fact: the reference number is typed by the
 * customer and the screenshot is a picture they chose. Everything here is
 * shaped around a human confirming it later.
 */

import { z } from 'zod';

import type { QuoteType } from './quote.schema';

export const PAYMENT_STATUSES = ['submitted', 'verified', 'rejected'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/**
 * Upload ceiling. The browser downscales to a ~1600px WebP first, so a real
 * screenshot lands far under this — the limit only exists to stop an
 * unoptimised original from hitting the serverless body cap (~4.5 MB) or
 * bloating a database row.
 */
export const PROOF_MAX_BYTES = 4 * 1024 * 1024;

/** What the file picker offers. Screenshots are PNG or JPEG in practice. */
export const PROOF_ACCEPT = 'image/png,image/jpeg,image/webp,image/heic,image/heif,image/*';

/** Admin → PATCH /api/admin/payments/[id] */
export const reviewPaymentSchema = z.object({
  action: z.enum(['verify', 'reject']),
  note: z.string().max(500).optional(),
});

export type ReviewPaymentInput = z.infer<typeof reviewPaymentSchema>;

/** A row in the admin payments list. Deliberately without the image bytes. */
export interface PaymentRecord {
  id: string;
  status: PaymentStatus;
  amount: string;
  currency: string;
  method: string;
  methodLabel: string;
  /**
   * True when the money changes hands in person rather than arriving in an
   * account — a cash booking has nothing to verify against a bank app, so every
   * "did it land?" affordance on the admin screens reads this first.
   */
  paidOnPickup: boolean;
  reference: string | null;
  /**
   * What the customer wrote at checkout about paying — for cash, when they
   * intend to hand it over. Lives on the quote; surfaced here because the
   * payment screen is where the team acts on it.
   */
  customerNote: string | null;
  /** 'full_payment' | 'partial_payment' — what the settled quote was asking for. */
  quoteType: QuoteType;
  quoteTypeLabel: string;
  /**
   * True when `amount` is a downpayment rather than the whole booking.
   *
   * The distinction the whole payments queue turns on once deposits exist:
   * `amount` is what to look for in the bank app, `quoteTotal` is what the trip
   * costs, and verifying the first does not settle the second.
   */
  isDownpayment: boolean;
  /** What is still to come after this payment. Null when nothing is deferred. */
  quoteBalance: string | null;
  hasProof: boolean;
  proofSize: number | null;
  createdAt: string;
  reviewedAt: string | null;
  reviewedByName: string | null;
  reviewNote: string | null;
  /** The lead this payment belongs to. */
  opportunityId: string;
  /**
   * The LEAD's reference, e.g. "L-001042".
   *
   * Deliberately not called `reference` — that name is already taken on this
   * type by the customer's own receipt number, and `quoteReference` by the
   * quote being settled. Three different references live on one payment row,
   * so each is named for what it identifies.
   */
  leadReference: string;
  opportunityTitle: string;
  contactId: string;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  /** The quote being settled. */
  quoteId: string;
  quoteReference: string;
  quoteTotal: string;
  quoteUrl: string;
}

/** The detail screen: the payment, its lead, and the rest of the deal's money. */
export interface PaymentDetail extends PaymentRecord {
  serviceLabel: string;
  vehicleLabel: string | null;
  tripDate: string | null;
  stage: string;
  /** Absolute path to the proof image, when one was uploaded. */
  proofUrl: string | null;
  proofMime: string | null;
  proofFilename: string | null;
  /** Every payment on this deal, so a split payment reads as one story. */
  dealPayments: {
    id: string;
    amount: string;
    method: string;
    methodLabel: string;
    quoteType: QuoteType;
    status: PaymentStatus;
    createdAt: string;
  }[];
  dealTotal: string;
  /** Sum of this deal's verified payments. */
  verifiedTotal: string;
}
