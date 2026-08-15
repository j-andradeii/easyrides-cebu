/**
 * Payment records — the money side of a quote.
 *
 * Every accepted quote produces one payment row, whether or not the customer
 * uploaded a screenshot. That row is what the team works from: `/admin/payments`
 * is a queue of "did this actually arrive?", not a ledger of settled cash.
 *
 * Proof images live in the database (base64 in `payments.proof_data`) and are
 * served through an admin-authenticated route. That is a deliberate trade: a
 * blob store would be cheaper per byte, but these are screenshots of people's
 * banking apps and a public URL is a public URL. Swapping in a bucket later
 * means changing `storeProof` and the proof route — nothing else.
 */

import 'server-only';

import { and, desc, eq, inArray, ne, sql } from 'drizzle-orm';

import { db, type DbExecutor } from '@/db/client';
import {
  adminUsers,
  contacts,
  opportunities,
  payments,
  pipelineStages,
  quotes,
  type Payment,
} from '@/db/schema';
import { getPaymentMethod, paymentMethodLabel } from '@/data/payment-methods';
import { resolveImageMime } from '@/lib/image-mime';
import {
  PROOF_MAX_BYTES,
  type PaymentDetail,
  type PaymentRecord,
  type PaymentStatus,
} from '@/models/payment.schema';
import { quoteTypeLabel, type QuoteType } from '@/models/quote.schema';
import { buildOpportunityTitle, serviceLabel, vehicleLabel } from './normalize';
import { quoteReference, quoteUrl } from './quote-links';

/** A rejected upload, phrased for the customer rather than the log. */
export class ProofRejectedError extends Error {}

export interface ProofUpload {
  data: string;
  mime: string;
  filename: string;
  size: number;
}

/**
 * Validates an uploaded screenshot and prepares it for storage.
 *
 * The declared Content-Type is ignored in favour of magic bytes — multipart
 * headers are attacker-controlled, and a phone's share sheet gets them wrong
 * often enough that trusting them would reject honest customers too.
 */
export async function prepareProof(file: Blob, filename: string): Promise<ProofUpload> {
  if (file.size === 0) {
    throw new ProofRejectedError('That file was empty. Please try uploading the screenshot again.');
  }
  if (file.size > PROOF_MAX_BYTES) {
    throw new ProofRejectedError(
      'That image is too large. Please upload a screenshot instead of a full-resolution photo.'
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const mime = resolveImageMime(bytes, file.type || '', filename);

  if (!mime) {
    throw new ProofRejectedError('That file is not an image. Please upload a screenshot or photo.');
  }

  return {
    data: bytes.toString('base64'),
    mime,
    filename: filename || 'proof-of-payment',
    size: bytes.byteLength,
  };
}

/** Decodes a stored proof back into bytes for the admin image route. */
export function decodeProof(payment: Pick<Payment, 'proofData'>): Buffer | null {
  return payment.proofData ? Buffer.from(payment.proofData, 'base64') : null;
}

// --- Write ------------------------------------------------------------------

export interface RecordPaymentInput {
  quoteId: string;
  opportunityId: string;
  contactId: string;
  amount: string;
  currency: string;
  method: string;
  reference?: string | null;
  proof?: ProofUpload | null;
}

/** Files the customer's claim. Always `submitted` — only a human verifies. */
export async function recordPayment(
  input: RecordPaymentInput,
  executor: DbExecutor = db
): Promise<Payment> {
  const [payment] = await executor
    .insert(payments)
    .values({
      quoteId: input.quoteId,
      opportunityId: input.opportunityId,
      contactId: input.contactId,
      amount: input.amount,
      currency: input.currency,
      method: input.method,
      reference: input.reference?.trim() || null,
      status: 'submitted',
      proofData: input.proof?.data ?? null,
      proofMime: input.proof?.mime ?? null,
      proofFilename: input.proof?.filename ?? null,
      proofSize: input.proof?.size ?? null,
    })
    .returning();

  return payment;
}

/** The payment filed against a quote, if the customer has settled it. */
export async function latestPaymentForQuote(
  quoteId: string,
  executor: DbExecutor = db
): Promise<Payment | undefined> {
  const [payment] = await executor
    .select()
    .from(payments)
    .where(eq(payments.quoteId, quoteId))
    .orderBy(desc(payments.createdAt))
    .limit(1);

  return payment;
}

// --- Read -------------------------------------------------------------------

/** The joined shape every payment view is built from. */
const paymentRowSelection = {
  payment: payments,
  quote: quotes,
  opportunity: opportunities,
  contact: contacts,
  reviewerName: adminUsers.name,
};

function toRecord(row: {
  payment: Payment;
  quote: typeof quotes.$inferSelect;
  opportunity: typeof opportunities.$inferSelect;
  contact: typeof contacts.$inferSelect;
  reviewerName: string | null;
}): PaymentRecord {
  const { payment, quote, opportunity, contact } = row;

  return {
    id: payment.id,
    status: payment.status as PaymentStatus,
    amount: payment.amount,
    currency: payment.currency,
    method: payment.method,
    methodLabel: paymentMethodLabel(payment.method),
    paidOnPickup: isPayOnPickup(payment.method),
    reference: payment.reference,
    customerNote: quote.paymentNote,
    quoteType: quote.quoteType as QuoteType,
    quoteTypeLabel: quoteTypeLabel(quote.quoteType),
    hasProof: Boolean(payment.proofData),
    proofSize: payment.proofSize,
    createdAt: payment.createdAt.toISOString(),
    reviewedAt: payment.reviewedAt?.toISOString() ?? null,
    reviewedByName: row.reviewerName,
    reviewNote: payment.reviewNote,
    opportunityId: payment.opportunityId,
    leadReference: opportunity.reference,
    opportunityTitle:
      opportunity.title ||
      buildOpportunityTitle(opportunity.serviceType, contact.fullName, contact.phone),
    contactId: payment.contactId,
    customerName: contact.fullName,
    customerPhone: contact.phone,
    customerEmail: contact.email,
    quoteId: payment.quoteId,
    quoteReference: quoteReference(quote.id),
    quoteTotal: quote.total,
    quoteUrl: quoteUrl(quote.token),
  };
}

export interface ListPaymentsFilter {
  status?: PaymentStatus;
  opportunityId?: string;
  limit?: number;
}

export async function listPayments(filter: ListPaymentsFilter = {}): Promise<PaymentRecord[]> {
  const conditions = [
    filter.status ? eq(payments.status, filter.status) : undefined,
    filter.opportunityId ? eq(payments.opportunityId, filter.opportunityId) : undefined,
  ].filter(Boolean);

  const rows = await db
    .select(paymentRowSelection)
    .from(payments)
    .innerJoin(quotes, eq(quotes.id, payments.quoteId))
    .innerJoin(opportunities, eq(opportunities.id, payments.opportunityId))
    .innerJoin(contacts, eq(contacts.id, payments.contactId))
    .leftJoin(adminUsers, eq(adminUsers.id, payments.reviewedBy))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(payments.createdAt))
    .limit(filter.limit ?? 200);

  return rows.map(toRecord);
}

/** Everything the detail screen needs: the payment, the lead, and the deal's other payments. */
export async function getPaymentDetail(paymentId: string): Promise<PaymentDetail | undefined> {
  const [row] = await db
    .select(paymentRowSelection)
    .from(payments)
    .innerJoin(quotes, eq(quotes.id, payments.quoteId))
    .innerJoin(opportunities, eq(opportunities.id, payments.opportunityId))
    .innerJoin(contacts, eq(contacts.id, payments.contactId))
    .leftJoin(adminUsers, eq(adminUsers.id, payments.reviewedBy))
    .where(eq(payments.id, paymentId))
    .limit(1);

  if (!row) return undefined;

  const [stage] = await db
    .select({ name: pipelineStages.name })
    .from(pipelineStages)
    .where(eq(pipelineStages.id, row.opportunity.stageId))
    .limit(1);

  const siblings = await db
    .select({ payment: payments, quoteType: quotes.quoteType })
    .from(payments)
    .innerJoin(quotes, eq(quotes.id, payments.quoteId))
    .where(eq(payments.opportunityId, row.payment.opportunityId))
    .orderBy(desc(payments.createdAt));

  const [verified] = await db
    .select({ total: sql<string>`coalesce(sum(${payments.amount}), 0)::text` })
    .from(payments)
    .where(
      and(eq(payments.opportunityId, row.payment.opportunityId), eq(payments.status, 'verified'))
    );

  return {
    ...toRecord(row),
    serviceLabel: serviceLabel(row.opportunity.serviceType),
    vehicleLabel: vehicleLabel(row.opportunity.vehicleType),
    tripDate: row.opportunity.preferredDate,
    stage: stage?.name ?? 'Unknown',
    proofUrl: row.payment.proofData ? `/api/admin/payments/${row.payment.id}/proof` : null,
    proofMime: row.payment.proofMime,
    proofFilename: row.payment.proofFilename,
    dealPayments: siblings.map(({ payment, quoteType }) => ({
      id: payment.id,
      amount: payment.amount,
      method: payment.method,
      methodLabel: paymentMethodLabel(payment.method),
      quoteType: quoteType as QuoteType,
      status: payment.status as PaymentStatus,
      createdAt: payment.createdAt.toISOString(),
    })),
    dealTotal: row.opportunity.monetaryValue,
    verifiedTotal: verified?.total ?? '0',
  };
}

/** The badge count the portal shows — payments nobody has checked yet. */
export async function countPendingPayments(): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(payments)
    .where(eq(payments.status, 'submitted'));

  return row?.count ?? 0;
}

// --- Review -----------------------------------------------------------------

export interface ReviewPaymentParams {
  paymentId: string;
  action: 'verify' | 'reject';
  note?: string | null;
  adminUserId: string;
}

/**
 * Records a human's decision on a payment. Returns the row so the caller can
 * write the timeline entry — the decision belongs on the lead's history, not
 * just in this table.
 */
export async function reviewPayment(params: ReviewPaymentParams): Promise<Payment | undefined> {
  const [payment] = await db
    .update(payments)
    .set({
      status: params.action === 'verify' ? 'verified' : 'rejected',
      reviewedBy: params.adminUserId,
      reviewedAt: new Date(),
      reviewNote: params.note?.trim() || null,
      updatedAt: new Date(),
    })
    // Verified is terminal, and the guard lives in the WHERE rather than in a
    // read-then-write so two agents clicking at once cannot both win: the
    // second UPDATE matches no row and returns nothing.
    //
    // This is not only about a stale tab. The route emails the customer
    // "your payment is confirmed" on every successful verify, so without this
    // a re-verify sends them a duplicate receipt for money they sent once.
    .where(and(eq(payments.id, params.paymentId), ne(payments.status, 'verified')))
    .returning();

  return payment;
}

/** True when the method settles at pickup, so nothing was sent in advance. */
export function isPayOnPickup(method: string): boolean {
  return getPaymentMethod(method)?.paidOnPickup ?? false;
}

/** Payment ids for a set of quotes — used when building message context. */
export async function paymentsForQuotes(
  quoteIds: string[],
  executor: DbExecutor = db
): Promise<Payment[]> {
  if (quoteIds.length === 0) return [];

  return executor.select().from(payments).where(inArray(payments.quoteId, quoteIds));
}
