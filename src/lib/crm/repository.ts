/**
 * Shared CRM data access — the small set of reads/writes that intake, the admin
 * API and the workflow engine all need. Keeping them here means the timeline is
 * written the same way no matter who triggered the action.
 */

import 'server-only';

import { and, desc, eq, isNull, or, sql } from 'drizzle-orm';

import { db, type DbExecutor } from '@/db/client';
import {
  activities,
  contacts,
  inquiries,
  opportunities,
  pipelineStages,
  pipelines,
  quotes,
  reviews,
  type Contact,
  type Opportunity,
  type PipelineStage,
  type Quote,
} from '@/db/schema';
import { getPaymentMethod, paymentMethodLabel } from '@/data/payment-methods';
import { DEFAULT_PIPELINE_ID, type StageKey } from '@/lib/funnel/stages';
import { quoteTypeLabel } from '@/models/quote.schema';
import type {
  LiveQuoteSummary,
  PaymentSummary,
  QuoteLine,
  TemplateContext,
} from '@/lib/messaging/templates';
import { buildOpportunityTitle, firstName, serviceLabel, vehicleLabel } from './normalize';
import { latestPaymentForQuote } from './payments';
import {
  latestOpenQuote,
  latestOpenQuoteUrl,
  outstandingQuoteTotal,
  quoteReference,
  quoteUrl,
} from './quote-links';
import { siteUrl } from './site';
import { generateReferralCode, generateToken } from './tokens';

// --- Stage lookups ----------------------------------------------------------

interface StageCache {
  stages: PipelineStage[];
  expiresAt: number;
}

let stageCache: StageCache | null = null;
const STAGE_CACHE_TTL_MS = 60_000;

/** Stages of the default pipeline, ordered, cached briefly (they change rarely). */
export async function getStages(executor: DbExecutor = db): Promise<PipelineStage[]> {
  if (stageCache && stageCache.expiresAt > Date.now()) {
    return stageCache.stages;
  }

  const rows = await executor
    .select()
    .from(pipelineStages)
    .where(eq(pipelineStages.pipelineId, DEFAULT_PIPELINE_ID))
    .orderBy(pipelineStages.sortOrder);

  if (rows.length === 0) {
    throw new Error('No pipeline stages found — run `npm run db:seed` first.');
  }

  stageCache = { stages: rows, expiresAt: Date.now() + STAGE_CACHE_TTL_MS };
  return rows;
}

export function clearStageCache(): void {
  stageCache = null;
}

export async function getStageByKey(
  key: StageKey | string,
  executor: DbExecutor = db
): Promise<PipelineStage> {
  const stages = await getStages(executor);
  const stage = stages.find((candidate) => candidate.key === key);
  if (!stage) {
    throw new Error(`Unknown pipeline stage "${key}"`);
  }
  return stage;
}

export async function getStageById(
  id: string,
  executor: DbExecutor = db
): Promise<PipelineStage | undefined> {
  const stages = await getStages(executor);
  return stages.find((stage) => stage.id === id);
}

/** The default pipeline id, self-healing if the seed used a different one. */
export async function getDefaultPipelineId(executor: DbExecutor = db): Promise<string> {
  const [row] = await executor
    .select({ id: pipelines.id })
    .from(pipelines)
    .where(eq(pipelines.isDefault, true))
    .limit(1);
  return row?.id ?? DEFAULT_PIPELINE_ID;
}

// --- Contacts ---------------------------------------------------------------

/** Dedup lookup: normalized phone first, then email (plan §5). */
export async function findContact(
  executor: DbExecutor,
  phone: string | null,
  email: string | null
): Promise<Contact | undefined> {
  const predicates = [];
  if (phone) predicates.push(eq(contacts.phone, phone));
  if (email) predicates.push(eq(contacts.email, email));
  if (predicates.length === 0) return undefined;

  const [existing] = await executor
    .select()
    .from(contacts)
    .where(predicates.length === 1 ? predicates[0] : or(...predicates))
    .limit(1);

  return existing;
}

/** Every contact gets a share code so the referral invite always has a link. */
export async function ensureReferralCode(
  contact: Pick<Contact, 'id' | 'fullName' | 'referralCode'>,
  executor: DbExecutor = db
): Promise<string> {
  if (contact.referralCode) return contact.referralCode;

  // Collisions are rare but cheap to retry.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateReferralCode(contact.fullName);
    const [updated] = await executor
      .update(contacts)
      .set({ referralCode: code, updatedAt: new Date() })
      .where(and(eq(contacts.id, contact.id), isNull(contacts.referralCode)))
      .returning({ referralCode: contacts.referralCode });

    if (updated?.referralCode) return updated.referralCode;

    const [current] = await executor
      .select({ referralCode: contacts.referralCode })
      .from(contacts)
      .where(eq(contacts.id, contact.id))
      .limit(1);
    if (current?.referralCode) return current.referralCode;
  }

  throw new Error(`Could not allocate a referral code for contact ${contact.id}`);
}

// --- Activity timeline ------------------------------------------------------

export interface LogActivityInput {
  opportunityId?: string | null;
  contactId?: string | null;
  /** NULL means the system / an automation did it. */
  adminUserId?: string | null;
  type:
    | 'note'
    | 'stage_change'
    | 'message_out'
    | 'message_in'
    | 'call'
    | 'email'
    | 'task_created'
    | 'task_completed'
    | 'workflow'
    | 'system';
  channel?: string | null;
  subject?: string | null;
  body?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function logActivity(
  input: LogActivityInput,
  executor: DbExecutor = db
): Promise<void> {
  await executor.insert(activities).values({
    opportunityId: input.opportunityId ?? null,
    contactId: input.contactId ?? null,
    adminUserId: input.adminUserId ?? null,
    type: input.type,
    channel: input.channel ?? null,
    subject: input.subject ?? null,
    body: input.body ?? null,
    metadata: input.metadata ?? null,
  });
}

/**
 * §7A.2 — makes sure a tokenized /review/[token] link exists for this trip so
 * W4's review request has somewhere to point. Reused if one already exists.
 */
export async function ensureReviewToken(
  opportunityId: string,
  contactId: string,
  executor: DbExecutor = db
): Promise<string> {
  const [existing] = await executor
    .select({ token: reviews.token })
    .from(reviews)
    .where(eq(reviews.opportunityId, opportunityId))
    .orderBy(desc(reviews.createdAt))
    .limit(1);

  if (existing?.token) return existing.token;

  const token = generateToken();
  await executor.insert(reviews).values({ contactId, opportunityId, token });
  return token;
}

// --- Template context -------------------------------------------------------

// Re-exported so existing importers keep resolving it from here.
export { siteUrl };

const ACCEPTED_AT_FORMATTER = new Intl.DateTimeFormat('en-PH', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Asia/Manila',
});

const VALID_UNTIL_FORMATTER = new Intl.DateTimeFormat('en-PH', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'Asia/Manila',
});

/**
 * The quote currently in front of the customer. Its own total — never the deal
 * value, which on a partial payment is the sum of every instalment.
 */
export async function loadLiveQuoteSummary(
  opportunityId: string,
  executor: DbExecutor = db
): Promise<LiveQuoteSummary | null> {
  const quote = await latestOpenQuote(opportunityId, executor);
  if (!quote) return null;

  return {
    reference: quoteReference(quote.id),
    quoteType: quote.quoteType,
    typeLabel: quoteTypeLabel(quote.quoteType),
    isPartial: quote.quoteType === 'partial_payment',
    currency: quote.currency,
    total: quote.total,
    url: quoteUrl(quote.token),
    validUntil: VALID_UNTIL_FORMATTER.format(quote.validUntil),
    lineItems: quoteLines(quote.lineItems),
    subtotal: quote.subtotal,
    discount: quote.discount,
    notes: quote.notes,
  };
}

/**
 * `quotes.line_items` is jsonb, so it arrives as `unknown`. Normalising here
 * rather than casting keeps a malformed or legacy row from throwing inside a
 * template — an email that renders without a breakdown beats one that fails
 * to send at all.
 */
function quoteLines(value: unknown): QuoteLine[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return [];
    const item = entry as Record<string, unknown>;
    if (typeof item.label !== 'string') return [];

    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unitPrice);
    const amount = Number(item.amount);

    return [
      {
        label: item.label,
        description: typeof item.description === 'string' ? item.description : undefined,
        quantity: Number.isFinite(quantity) ? quantity : 1,
        unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0,
        amount: Number.isFinite(amount) ? amount : 0,
      },
    ];
  });
}

/**
 * The payment details behind one settled quote, set against the rest of the
 * deal so a booking split across instalments can say what is left to pay.
 */
export async function paymentSummaryForQuote(
  quote: Quote,
  executor: DbExecutor = db
): Promise<PaymentSummary> {
  const opportunityId = quote.opportunityId;

  const [settledRow] = await executor
    .select({ total: sql<string>`coalesce(sum(${quotes.total}), 0)::text` })
    .from(quotes)
    .where(and(eq(quotes.opportunityId, opportunityId), eq(quotes.status, 'accepted')));

  const method = getPaymentMethod(quote.paymentMethod);
  const total = Number.parseFloat(quote.total);
  const deposit = quote.depositAmount ? Number.parseFloat(quote.depositAmount) : null;
  // A deposit that covers the whole trip leaves nothing to collect at pickup.
  const balance = deposit !== null && deposit > 0 && deposit < total ? total - deposit : null;

  const settledTotal = settledRow?.total ?? quote.total;
  const outstanding = await outstandingQuoteTotal(opportunityId, executor);
  const hasOutstanding = Number.parseFloat(outstanding) > 0;

  // The payment carries the screenshot; the team's alert links straight to it.
  const payment = await latestPaymentForQuote(quote.id, executor);

  return {
    reference: quoteReference(quote.id),
    quoteType: quote.quoteType,
    typeLabel: quoteTypeLabel(quote.quoteType),
    isPartial: quote.quoteType === 'partial_payment',
    methodLabel: method?.label ?? paymentMethodLabel(quote.paymentMethod),
    paidOnPickup: method?.paidOnPickup ?? false,
    paymentReference: quote.paymentReference,
    paymentNote: quote.paymentNote,
    currency: quote.currency,
    total: quote.total,
    depositAmount: quote.depositAmount,
    balanceDue: balance !== null ? balance.toFixed(2) : null,
    settledTotal,
    outstanding,
    bookingTotal: (Number.parseFloat(settledTotal) + Number.parseFloat(outstanding)).toFixed(2),
    outstandingUrl: hasOutstanding ? await latestOpenQuoteUrl(opportunityId, executor) : null,
    acceptedAt: quote.acceptedAt ? ACCEPTED_AT_FORMATTER.format(quote.acceptedAt) : null,
    quoteUrl: quoteUrl(quote.token),
    proofAttached: Boolean(payment?.proofData),
    adminPaymentUrl: payment ? `${siteUrl()}/admin/payments/${payment.id}` : null,
    lineItems: quoteLines(quote.lineItems),
    subtotal: quote.subtotal,
    discount: quote.discount,
    notes: quote.notes,
  };
}

/** The most recently settled quote on a deal, for the booking emails. */
async function loadPaymentSummary(
  opportunityId: string,
  executor: DbExecutor = db
): Promise<PaymentSummary | null> {
  const [quote] = await executor
    .select()
    .from(quotes)
    .where(and(eq(quotes.opportunityId, opportunityId), eq(quotes.status, 'accepted')))
    .orderBy(desc(quotes.acceptedAt))
    .limit(1);

  return quote ? paymentSummaryForQuote(quote, executor) : null;
}

/**
 * Everything a message template needs, gathered in one read. Used by the
 * workflow engine and by the review/referral routes.
 */
export async function buildTemplateContext(
  opportunity: Opportunity,
  contact: Contact,
  executor: DbExecutor = db
): Promise<TemplateContext> {
  const base = siteUrl();

  const [latestReview] = await executor
    .select({ token: reviews.token })
    .from(reviews)
    .where(eq(reviews.opportunityId, opportunity.id))
    .orderBy(desc(reviews.createdAt))
    .limit(1);

  // Tour enquiries name a specific tour, fleet enquiries a specific car and how
  // long for; without these the acknowledgement email would say "Car Rental"
  // and leave the customer wondering if we read it.
  const [latestInquiry] = await executor
    .select({
      tourTitle: inquiries.tourTitle,
      vehicleName: inquiries.vehicleName,
      rentalDays: inquiries.rentalDays,
      pickupLocation: inquiries.pickupLocation,
    })
    .from(inquiries)
    .where(eq(inquiries.opportunityId, opportunity.id))
    .orderBy(desc(inquiries.createdAt))
    .limit(1);

  return {
    name: firstName(contact.fullName),
    fullName: contact.fullName,
    phone: contact.phone,
    email: contact.email,
    serviceLabel: serviceLabel(opportunity.serviceType),
    vehicleLabel: vehicleLabel(opportunity.vehicleType),
    preferredDate: opportunity.preferredDate,
    tourTitle: latestInquiry?.tourTitle ?? null,
    vehicleName: latestInquiry?.vehicleName ?? null,
    rentalDays: latestInquiry?.rentalDays ?? null,
    pickupLocation: latestInquiry?.pickupLocation ?? null,
    opportunityTitle:
      opportunity.title || buildOpportunityTitle(opportunity.serviceType, contact.fullName, contact.phone),
    monetaryValue: opportunity.monetaryValue ?? '0',
    source: opportunity.source,
    adminUrl: `${base}/admin/inquiries/${opportunity.id}`,
    reviewUrl: latestReview ? `${base}/review/${latestReview.token}` : null,
    shareUrl: contact.referralCode ? `${base}/thanks/${contact.referralCode}` : null,
    quoteUrl: await latestOpenQuoteUrl(opportunity.id, executor),
    referralCode: contact.referralCode,
    quote: await loadLiveQuoteSummary(opportunity.id, executor),
    payment: await loadPaymentSummary(opportunity.id, executor),
    businessWhatsApp: process.env.WHATSAPP_BUSINESS_NUMBER ?? '639178046988',
    siteUrl: base,
  };
}

/** Loads the opportunity + its contact, or undefined if the deal is gone. */
export async function loadOpportunityWithContact(
  opportunityId: string,
  executor: DbExecutor = db
): Promise<{ opportunity: Opportunity; contact: Contact } | undefined> {
  const [row] = await executor
    .select({ opportunity: opportunities, contact: contacts })
    .from(opportunities)
    .innerJoin(contacts, eq(contacts.id, opportunities.contactId))
    .where(eq(opportunities.id, opportunityId))
    .limit(1);

  return row ? { opportunity: row.opportunity, contact: row.contact } : undefined;
}
