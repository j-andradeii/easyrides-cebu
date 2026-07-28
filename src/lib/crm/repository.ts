/**
 * Shared CRM data access — the small set of reads/writes that intake, the admin
 * API and the workflow engine all need. Keeping them here means the timeline is
 * written the same way no matter who triggered the action.
 */

import 'server-only';

import { and, desc, eq, isNull, or } from 'drizzle-orm';

import { db, type DbExecutor } from '@/db/client';
import {
  activities,
  contacts,
  opportunities,
  pipelineStages,
  pipelines,
  reviews,
  type Contact,
  type Opportunity,
  type PipelineStage,
} from '@/db/schema';
import { DEFAULT_PIPELINE_ID, type StageKey } from '@/lib/funnel/stages';
import type { TemplateContext } from '@/lib/messaging/templates';
import { buildOpportunityTitle, firstName, serviceLabel, vehicleLabel } from './normalize';
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

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
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

  return {
    name: firstName(contact.fullName),
    fullName: contact.fullName,
    phone: contact.phone,
    email: contact.email,
    serviceLabel: serviceLabel(opportunity.serviceType),
    vehicleLabel: vehicleLabel(opportunity.vehicleType),
    preferredDate: opportunity.preferredDate,
    tourTitle: null,
    opportunityTitle:
      opportunity.title || buildOpportunityTitle(opportunity.serviceType, contact.fullName, contact.phone),
    monetaryValue: opportunity.monetaryValue ?? '0',
    source: opportunity.source,
    adminUrl: `${base}/admin/inquiries/${opportunity.id}`,
    reviewUrl: latestReview ? `${base}/review/${latestReview.token}` : null,
    shareUrl: contact.referralCode ? `${base}/thanks/${contact.referralCode}` : null,
    referralCode: contact.referralCode,
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
