/**
 * Quote lifecycle — build → send → view → accept.
 *
 * A quote is a tokenized checkout page. Creating one moves the deal to Quote
 * Sent (which fires W3); accepting one moves it to Booked (which fires W4). The
 * customer never logs in — the token in the URL is the authentication, which is
 * why it is unguessable and expires.
 */

import 'server-only';

import { and, desc, eq, inArray, lt } from 'drizzle-orm';

import { db, type DbExecutor } from '@/db/client';
import { adminUsers, contacts, opportunities, quotes, type Quote } from '@/db/schema';
import { serviceLabel, vehicleLabel } from './normalize';
import { isQuoteExpired, latestOpenQuoteUrl, quoteReference, quoteUrl } from './quote-links';
import { loadOpportunityWithContact, logActivity } from './repository';
import { generateToken } from './tokens';
import type {
  CreateQuoteInput,
  PublicQuote,
  QuoteLineItem,
  QuoteRecord,
  QuoteStatus,
} from '@/models/quote.schema';

// Callers import the whole quote surface from here.
export { isQuoteExpired, latestOpenQuoteUrl, quoteReference, quoteUrl };

/** Statuses a customer can still act on. */
const OPEN_STATUSES = ['sent', 'viewed'] as const;

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
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


/** The effective status, accounting for a validity window that has lapsed. */
export function effectiveStatus(quote: Pick<Quote, 'status' | 'validUntil'>): QuoteStatus {
  return isQuoteExpired(quote) ? 'expired' : (quote.status as QuoteStatus);
}

// --- Create -----------------------------------------------------------------

export interface CreateQuoteResult {
  quote: Quote;
  url: string;
}

/**
 * Builds and sends a quote. Supersedes any quote still awaiting a decision, so
 * a customer can never be looking at two live prices for the same trip.
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

  const quote = await db.transaction(async (tx) => {
    // Retire earlier open quotes on this deal.
    await tx
      .update(quotes)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(
        and(
          eq(quotes.opportunityId, opportunity.id),
          inArray(quotes.status, [...OPEN_STATUSES])
        )
      );

    const [created] = await tx
      .insert(quotes)
      .values({
        opportunityId: opportunity.id,
        contactId: contact.id,
        token: generateToken(),
        status: 'sent',
        lineItems,
        subtotal: subtotal.toFixed(2),
        discount: discount.toFixed(2),
        total: total.toFixed(2),
        depositAmount:
          params.input.depositAmount !== null && params.input.depositAmount !== undefined
            ? params.input.depositAmount.toFixed(2)
            : null,
        notes: params.input.notes ?? null,
        validUntil,
        createdBy: params.adminUserId,
      })
      .returning();

    // The quote total is the deal value — that's what the forecast should use.
    await tx
      .update(opportunities)
      .set({ monetaryValue: total.toFixed(2), updatedAt: new Date() })
      .where(eq(opportunities.id, opportunity.id));

    return created;
  });

  await logActivity({
    opportunityId: opportunity.id,
    contactId: contact.id,
    adminUserId: params.adminUserId,
    type: 'message_out',
    channel: 'email',
    subject: `Quote ${quoteReference(quote.id)} sent — ${quote.currency} ${total.toFixed(2)}`,
    body: `Valid until ${validUntil.toISOString()}\n${quoteUrl(quote.token)}`,
    metadata: {
      quoteId: quote.id,
      total: total.toFixed(2),
      link: null,
      quoteUrl: quoteUrl(quote.token),
    },
  });

  return { quote, url: quoteUrl(quote.token) };
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
      total: quote.total,
      depositAmount: quote.depositAmount,
      notes: quote.notes,
      validUntil: quote.validUntil.toISOString(),
      isExpired: isQuoteExpired(quote),
      acceptedAt: quote.acceptedAt?.toISOString() ?? null,
      paymentMethod: quote.paymentMethod,
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

  return rows.map(({ quote, createdByName }) => ({
    id: quote.id,
    token: quote.token,
    status: effectiveStatus(quote),
    reference: quoteReference(quote.id),
    currency: quote.currency,
    lineItems: quote.lineItems as QuoteLineItem[],
    subtotal: quote.subtotal,
    discount: quote.discount,
    total: quote.total,
    depositAmount: quote.depositAmount,
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
    url: quoteUrl(quote.token),
  }));
}


/** Sweeps lapsed quotes into 'expired'. Called by the cron runner. */
export async function expireLapsedQuotes(): Promise<number> {
  const expired = await db
    .update(quotes)
    .set({ status: 'expired', updatedAt: new Date() })
    .where(and(inArray(quotes.status, [...OPEN_STATUSES]), lt(quotes.validUntil, new Date())))
    .returning({ id: quotes.id });

  return expired.length;
}
