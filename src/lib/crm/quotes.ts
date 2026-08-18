/**
 * Quote lifecycle — build → send → view → accept.
 *
 * A quote is a tokenized checkout page. Creating one moves the deal to Quote
 * Sent (which fires W3); accepting one moves it to Booked (which fires W4). The
 * customer never logs in — the token in the URL is the authentication, which is
 * why it is unguessable and expires.
 *
 * A deal normally carries one live quote, but it can carry several: a deposit
 * now and the balance nearer the trip, or a tour split across payments. That is
 * why the deal value is always summed from the quotes rather than copied from
 * whichever one was written last.
 */

import 'server-only';

import { and, desc, eq, inArray, lt, sql } from 'drizzle-orm';

import { db, type DbExecutor } from '@/db/client';
import {
  adminUsers,
  contacts,
  opportunities,
  quotes,
  referralCredits,
  type Quote,
} from '@/db/schema';
import { applyCreditsToQuote, releaseCreditsForQuotes } from './credits';
import { serviceLabel, vehicleLabel } from './normalize';
import {
  OPEN_QUOTE_STATUSES,
  isQuoteExpired,
  latestOpenQuoteUrl,
  outstandingQuoteTotal,
  quoteReference,
  quoteUrl,
} from './quote-links';
import { loadOpportunityWithContact, logActivity } from './repository';
import { generateToken } from './tokens';
import { balanceAfterDeposit, resolveDeposit } from '@/models/quote.schema';
import type {
  CreateQuoteInput,
  PublicQuote,
  QuoteLineItem,
  QuoteRecord,
  QuoteStatus,
  QuoteType,
} from '@/models/quote.schema';

// Callers import the whole quote surface from here.
export {
  isQuoteExpired,
  latestOpenQuoteUrl,
  outstandingQuoteTotal,
  quoteReference,
  quoteUrl,
};

/** Statuses a customer can still act on. */
const OPEN_STATUSES = OPEN_QUOTE_STATUSES;

/**
 * Statuses that count toward the deal value: what the customer has agreed to
 * pay, plus what is still live in front of them. Declined, cancelled and
 * expired quotes are dead money and must not inflate the forecast.
 */
const BILLABLE_STATUSES = [...OPEN_STATUSES, 'accepted'] as const;

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Re-points `opportunities.monetary_value` at the sum of the deal's billable
 * quotes. Call after anything that creates, cancels or settles a quote — with
 * partial payments the newest quote is only ever part of the picture.
 */
export async function syncOpportunityValue(
  opportunityId: string,
  executor: DbExecutor = db
): Promise<string> {
  const [row] = await executor
    .select({ total: sql<string>`coalesce(sum(${quotes.total}), 0)::text` })
    .from(quotes)
    .where(
      and(
        eq(quotes.opportunityId, opportunityId),
        inArray(quotes.status, [...BILLABLE_STATUSES])
      )
    );

  const total = row?.total ?? '0';

  await executor
    .update(opportunities)
    .set({ monetaryValue: total, updatedAt: new Date() })
    .where(eq(opportunities.id, opportunityId));

  return total;
}


/** Server-side totals — never trust amounts computed in the browser. */
export function priceQuote(input: CreateQuoteInput): {
  lineItems: QuoteLineItem[];
  subtotal: number;
  discount: number;
  total: number;
} {
  const lineItems: QuoteLineItem[] = input.lineItems.map((item) => ({
    label: item.label,
    description: item.description,
    quantity: round2(item.quantity),
    unitPrice: round2(item.unitPrice),
    amount: round2(item.quantity * item.unitPrice),
  }));

  const subtotal = round2(lineItems.reduce((sum, item) => sum + item.amount, 0));
  // A discount can zero a quote but never make it negative.
  const discount = round2(Math.min(input.discount ?? 0, subtotal));

  return { lineItems, subtotal, discount, total: round2(subtotal - discount) };
}


/**
 * Whether a quote has to be paid before the trip rather than at pickup.
 *
 * A downpayment only does its job if it arrives in advance — that is the whole
 * point of asking for one — so checkout must not offer to settle it in cash on
 * the day. Kept here, next to the quote, because both the public page and the
 * accept route have to reach the same verdict from the same row.
 */
export function requiresAdvancePayment(
  quote: Pick<Quote, 'quoteType' | 'depositAmount'>
): boolean {
  if (quote.quoteType === 'partial_payment') return true;
  return quote.depositAmount !== null && Number.parseFloat(quote.depositAmount) > 0;
}

/**
 * What the customer actually has to send to settle this quote now: the
 * downpayment when there is one, otherwise the whole total.
 */
export function amountDueNow(quote: Pick<Quote, 'total' | 'depositAmount'>): string {
  return quote.depositAmount && Number.parseFloat(quote.depositAmount) > 0
    ? quote.depositAmount
    : quote.total;
}

/** Has the customer already settled a quote on this deal? */
export async function hasAcceptedQuote(
  opportunityId: string,
  executor: DbExecutor = db
): Promise<boolean> {
  const [row] = await executor
    .select({ id: quotes.id })
    .from(quotes)
    .where(and(eq(quotes.opportunityId, opportunityId), eq(quotes.status, 'accepted')))
    .limit(1);

  return Boolean(row);
}

/** The effective status, accounting for a validity window that has lapsed. */
export function effectiveStatus(quote: Pick<Quote, 'status' | 'validUntil'>): QuoteStatus {
  return isQuoteExpired(quote) ? 'expired' : (quote.status as QuoteStatus);
}

// --- Create -----------------------------------------------------------------

export interface CreateQuoteResult {
  quote: Quote;
  url: string;
  /** Of the quote's discount, how much came from referral credits. */
  creditApplied: number;
}

/**
 * Builds and sends a quote.
 *
 * By default it supersedes any quote still awaiting a decision, so a customer
 * can never be looking at two competing prices for the same trip. Pass
 * `supersedeOpen: false` when the new quote is *additional* rather than a
 * correction — a balance to follow a deposit, or a second instalment — and both
 * links stay live.
 */
export async function createQuote(params: {
  opportunityId: string;
  input: CreateQuoteInput;
  adminUserId: string;
  adminName: string;
}): Promise<CreateQuoteResult> {
  const loaded = await loadOpportunityWithContact(params.opportunityId);
  if (!loaded) throw new Error('Opportunity not found');

  const { opportunity, contact } = loaded;
  const { lineItems, subtotal, discount, total } = priceQuote(params.input);

  const validUntil = new Date(
    Date.now() + (params.input.validForDays ?? 7) * 24 * 60 * 60 * 1000
  );

  const supersedeOpen = params.input.supersedeOpen ?? true;

  const { quote, creditApplied } = await db.transaction(async (tx) => {
    // Retire earlier open quotes on this deal — unless this one is meant to sit
    // alongside them (a balance following a deposit).
    if (supersedeOpen) {
      const superseded = await tx
        .update(quotes)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(
          and(
            eq(quotes.opportunityId, opportunity.id),
            inArray(quotes.status, [...OPEN_STATUSES])
          )
        )
        .returning({ id: quotes.id });

      // A cancelled quote is not going to be accepted, so anything it had
      // reserved goes back to the customer — including, usually, the very
      // credits this replacement quote is about to reserve again.
      await releaseCreditsForQuotes(
        superseded.map((row) => row.id),
        tx
      );
    }

    let created = (
      await tx
        .insert(quotes)
        .values({
          opportunityId: opportunity.id,
          contactId: contact.id,
          token: generateToken(),
          status: 'sent',
          quoteType: params.input.quoteType ?? 'full_payment',
          lineItems,
          subtotal: subtotal.toFixed(2),
          discount: discount.toFixed(2),
          total: total.toFixed(2),
          depositAmount: resolveDeposit(params.input.depositAmount, total)?.toFixed(2) ?? null,
          notes: params.input.notes ?? null,
          validUntil,
          createdBy: params.adminUserId,
        })
        .returning()
    )[0];

    /**
     * Credits are reserved *after* the insert because reserving them needs the
     * quote id, and re-priced from what was actually reserved rather than what
     * the browser asked for — see `applyCreditsToQuote`.
     */
    const { amount: reserved } = await applyCreditsToQuote(
      {
        contactId: contact.id,
        creditIds: params.input.creditIds ?? [],
        quoteId: created.id,
      },
      tx
    );

    if (reserved > 0) {
      // Same floor as `priceQuote`: a discount can zero a quote, never invert it.
      const combined = round2(Math.min(discount + reserved, subtotal));
      const discountedTotal = round2(subtotal - combined);

      created = (
        await tx
          .update(quotes)
          .set({
            discount: combined.toFixed(2),
            total: discountedTotal.toFixed(2),
            // The credit just moved the price the downpayment was a slice of.
            // Re-clamping here is what stops a ₱3,000 deposit surviving onto a
            // quote a referral credit brought down to ₱2,500 — the customer
            // would be asked for more up front than the trip now costs.
            depositAmount:
              resolveDeposit(params.input.depositAmount, discountedTotal)?.toFixed(2) ?? null,
            updatedAt: new Date(),
          })
          .where(eq(quotes.id, created.id))
          .returning()
      )[0];
    }

    // Every live quote together is the deal value — not just this one, which on
    // a split payment is only part of what the customer owes.
    await syncOpportunityValue(opportunity.id, tx);

    return { quote: created, creditApplied: reserved };
  });

  const finalTotal = Number(quote.total);

  await logActivity({
    opportunityId: opportunity.id,
    contactId: contact.id,
    adminUserId: params.adminUserId,
    type: 'message_out',
    channel: 'email',
    subject: `Quote ${quoteReference(quote.id)} sent — ${quote.currency} ${finalTotal.toFixed(2)}${
      supersedeOpen ? '' : ' (additional payment)'
    }`,
    body: [
      `Valid until ${validUntil.toISOString()}`,
      // The figure the customer is actually being asked for today. On a
      // downpayment quote the total above is the whole trip, so without this
      // line the timeline reads as if we billed them the lot.
      quote.depositAmount
        ? `Downpayment due now: ${quote.currency} ${quote.depositAmount} (balance ${
            quote.currency
          } ${balanceAfterDeposit(quote.total, quote.depositAmount) ?? '0.00'})`
        : null,
      creditApplied > 0
        ? `Referral credit applied: ${quote.currency} ${creditApplied.toFixed(2)}`
        : null,
      quoteUrl(quote.token),
    ]
      .filter(Boolean)
      .join('\n'),
    metadata: {
      quoteId: quote.id,
      total: finalTotal.toFixed(2),
      depositAmount: quote.depositAmount,
      creditApplied: creditApplied.toFixed(2),
      supersedeOpen,
      link: null,
      quoteUrl: quoteUrl(quote.token),
    },
  });

  return { quote, url: quoteUrl(quote.token), creditApplied };
}

// --- Read (public) ----------------------------------------------------------

export interface ResolvedQuote {
  quote: Quote;
  publicQuote: PublicQuote;
}

/**
 * Loads a quote by its public token and marks it viewed the first time. Returns
 * undefined for an unknown token — the caller should 404 rather than explain.
 */
export async function resolveQuoteByToken(token: string): Promise<ResolvedQuote | undefined> {
  const [row] = await db
    .select({ quote: quotes, contact: contacts, opportunity: opportunities })
    .from(quotes)
    .innerJoin(contacts, eq(contacts.id, quotes.contactId))
    .innerJoin(opportunities, eq(opportunities.id, quotes.opportunityId))
    .where(eq(quotes.token, token))
    .limit(1);

  if (!row) return undefined;

  let quote = row.quote;

  const [creditRow] = await db
    .select({ total: sql<string>`coalesce(sum(${referralCredits.amount}), 0)::text` })
    .from(referralCredits)
    .where(
      and(
        eq(referralCredits.quoteId, quote.id),
        inArray(referralCredits.status, ['applied', 'redeemed'])
      )
    );

  // First open — record it, and let the team see the customer is engaged.
  if (quote.status === 'sent' && !quote.viewedAt) {
    const now = new Date();
    const [updated] = await db
      .update(quotes)
      .set({ status: 'viewed', viewedAt: now, updatedAt: now })
      .where(eq(quotes.id, quote.id))
      .returning();
    quote = updated ?? quote;

    await logActivity({
      opportunityId: quote.opportunityId,
      contactId: quote.contactId,
      type: 'system',
      subject: `Customer opened quote ${quoteReference(quote.id)}`,
      metadata: { quoteId: quote.id },
    });
  }

  return {
    quote,
    publicQuote: {
      token: quote.token,
      status: effectiveStatus(quote),
      quoteType: quote.quoteType as QuoteType,
      reference: quoteReference(quote.id),
      customerName: row.contact.fullName ?? 'there',
      serviceLabel: serviceLabel(row.opportunity.serviceType),
      vehicleLabel: vehicleLabel(row.opportunity.vehicleType),
      tripDate: row.opportunity.preferredDate,
      tourTitle: null,
      lineItems: quote.lineItems as QuoteLineItem[],
      currency: quote.currency,
      subtotal: quote.subtotal,
      discount: quote.discount,
      creditApplied: creditRow?.total ?? '0',
      total: quote.total,
      depositAmount: quote.depositAmount,
      balanceDue: balanceAfterDeposit(quote.total, quote.depositAmount),
      requiresAdvancePayment: requiresAdvancePayment(quote),
      notes: quote.notes,
      validUntil: quote.validUntil.toISOString(),
      isExpired: isQuoteExpired(quote),
      acceptedAt: quote.acceptedAt?.toISOString() ?? null,
      paymentMethod: quote.paymentMethod,
      paymentNote: quote.paymentNote,
      businessWhatsApp: process.env.WHATSAPP_BUSINESS_NUMBER ?? '639178046988',
    },
  };
}

// --- Admin listing ----------------------------------------------------------

export async function listQuotesForOpportunity(
  opportunityId: string,
  executor: DbExecutor = db
): Promise<QuoteRecord[]> {
  const rows = await executor
    .select({ quote: quotes, createdByName: adminUsers.name })
    .from(quotes)
    .leftJoin(adminUsers, eq(adminUsers.id, quotes.createdBy))
    .where(eq(quotes.opportunityId, opportunityId))
    .orderBy(desc(quotes.createdAt));

  /**
   * How much of each quote's discount is referral credit.
   *
   * One grouped query rather than a join on the select above: a quote can carry
   * several credits, and joining would multiply the quote rows. Released
   * credits are excluded by their status — a credit that came back is no longer
   * part of this quote's story.
   */
  const creditRows = rows.length
    ? await executor
        .select({
          quoteId: referralCredits.quoteId,
          total: sql<string>`coalesce(sum(${referralCredits.amount}), 0)::text`,
        })
        .from(referralCredits)
        .where(
          and(
            inArray(
              referralCredits.quoteId,
              rows.map(({ quote }) => quote.id)
            ),
            inArray(referralCredits.status, ['applied', 'redeemed'])
          )
        )
        .groupBy(referralCredits.quoteId)
    : [];

  const creditByQuote = new Map(
    creditRows.filter((row) => row.quoteId).map((row) => [row.quoteId!, row.total])
  );

  return rows.map(({ quote, createdByName }) => ({
    id: quote.id,
    token: quote.token,
    status: effectiveStatus(quote),
    quoteType: quote.quoteType as QuoteType,
    reference: quoteReference(quote.id),
    currency: quote.currency,
    lineItems: quote.lineItems as QuoteLineItem[],
    subtotal: quote.subtotal,
    discount: quote.discount,
    total: quote.total,
    depositAmount: quote.depositAmount,
    balanceDue: balanceAfterDeposit(quote.total, quote.depositAmount),
    notes: quote.notes,
    validUntil: quote.validUntil.toISOString(),
    isExpired: isQuoteExpired(quote),
    sentAt: quote.sentAt.toISOString(),
    viewedAt: quote.viewedAt?.toISOString() ?? null,
    acceptedAt: quote.acceptedAt?.toISOString() ?? null,
    declinedAt: quote.declinedAt?.toISOString() ?? null,
    declineReason: quote.declineReason,
    paymentMethod: quote.paymentMethod,
    paymentReference: quote.paymentReference,
    createdByName,
    creditApplied: creditByQuote.get(quote.id) ?? '0',
    url: quoteUrl(quote.token),
  }));
}


/** Sweeps lapsed quotes into 'expired'. Called by the cron runner. */
export async function expireLapsedQuotes(): Promise<number> {
  const expired = await db
    .update(quotes)
    .set({ status: 'expired', updatedAt: new Date() })
    .where(and(inArray(quotes.status, [...OPEN_STATUSES]), lt(quotes.validUntil, new Date())))
    .returning({ id: quotes.id, opportunityId: quotes.opportunityId });

  // A lapsed price is no longer money on the table, so the deals it was
  // propping up need their value recomputed.
  for (const opportunityId of new Set(expired.map((row) => row.opportunityId))) {
    await syncOpportunityValue(opportunityId);
  }

  // The customer never accepted, so they never spent their credit. Letting it
  // stay reserved against a dead quote would quietly confiscate a reward they
  // earned — the one failure mode of this whole feature nobody would notice.
  await releaseCreditsForQuotes(expired.map((row) => row.id));

  return expired.length;
}
