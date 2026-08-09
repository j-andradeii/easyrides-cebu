/**
 * Lead intake — plan §8.
 *
 * One transaction turns a form submission into the three CRM records:
 *   upsert contact → create opportunity @ New Lead → insert immutable inquiry
 *
 * The W1 automation is fired *after* the transaction commits so a slow message
 * provider can never roll back a captured lead.
 */

import 'server-only';

import { and, eq, gte, isNotNull, isNull, or, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { contacts, inquiries, opportunities, referrals } from '@/db/schema';
import { findCampaignForIntake } from '@/lib/campaigns/repository';
import { handleInquiryCreated } from '@/lib/workflows/engine';
import { campaignSource, type InquirySubmissionData } from '@/models/inquiry.schema';
import { issueCredit } from './credits';
import { buildOpportunityTitle, normalizeEmail, normalizePhone, toDateOnly } from './normalize';
import { getDefaultPipelineId, getStageByKey, logActivity } from './repository';
import { REFEREE_CREDIT_AMOUNT, REFEREE_REWARD_LABEL } from './rewards';

/** §15 — a crude but effective per-IP throttle on the public endpoint. */
const RATE_LIMIT_WINDOW_MS = 10 * 60_000;
const RATE_LIMIT_MAX_SUBMISSIONS = 6;

export interface IntakeInput {
  data: InquirySubmissionData;
  /** The exact posted body, preserved verbatim on the inquiry row. */
  rawPayload: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  /**
   * Skips W1 enrolment — set when an agent enters the lead by hand.
   *
   * W1 emails the customer "we've got your inquiry" and alerts the team, which
   * is wrong for someone standing at the counter or already on the phone. It
   * also chains into W2, whose WhatsApp drip ends by auto-moving the deal to
   * Lost after 72h of "no response" — a lead an agent is actively working must
   * never be closed by a timer it was never meant to be on.
   *
   * Only the automations are skipped. The contact, opportunity and inquiry are
   * still written exactly as they are for a web lead, and referral attribution
   * below still runs.
   */
  skipAutomations?: boolean;
}

export interface IntakeResult {
  contactId: string;
  opportunityId: string;
  inquiryId: string;
  isReturningCustomer: boolean;
}

export async function isRateLimited(ipAddress: string | null): Promise<boolean> {
  if (!ipAddress) return false;

  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(inquiries)
    .where(and(eq(inquiries.ipAddress, ipAddress), gte(inquiries.createdAt, since)));

  return (row?.count ?? 0) >= RATE_LIMIT_MAX_SUBMISSIONS;
}

/**
 * Persists an inquiry and starts the funnel. Returns the created ids so the
 * caller can log or redirect.
 */
export async function createInquiry(input: IntakeInput): Promise<IntakeResult> {
  const { data } = input;

  const phone = normalizePhone(data.phone);
  const email = normalizeEmail(data.email);
  const preferredDate = toDateOnly(data.preferredDate);
  const pipelineId = await getDefaultPipelineId();
  const newLeadStage = await getStageByKey('new_lead');

  /**
   * A promo submission is attributed twice over: `campaignId` is the durable
   * link the /admin/campaigns totals are counted from, and `source` becomes
   * "campaign:<slug>" so the source filter and the funnel report — both of
   * which already read that column — pick promos up with no changes.
   *
   * Resolved rather than trusted: an unknown slug attributes to nothing instead
   * of writing a source for a campaign that does not exist.
   */
  const campaign = data.campaignSlug ? await findCampaignForIntake(data.campaignSlug) : null;
  const source = campaign ? campaignSource(campaign.slug) : data.source;

  const result = await db.transaction(async (tx) => {
    // 1) Upsert the contact — dedupe by normalized phone, then email.
    const predicates = [];
    if (phone) predicates.push(eq(contacts.phone, phone));
    if (email) predicates.push(eq(contacts.email, email));

    const [existing] = predicates.length
      ? await tx
          .select()
          .from(contacts)
          .where(predicates.length === 1 ? predicates[0] : or(...predicates))
          .limit(1)
      : [];

    let contact = existing;

    if (contact) {
      // Fill in anything we learned this time without clobbering known values.
      const patch: Partial<typeof contacts.$inferInsert> = {};
      if (!contact.fullName && data.fullName) patch.fullName = data.fullName;
      if (!contact.email && email) patch.email = email;
      if (!contact.phone && phone) patch.phone = phone;
      if (!contact.countryCode && data.countryCode) patch.countryCode = data.countryCode;

      if (Object.keys(patch).length > 0) {
        const [updated] = await tx
          .update(contacts)
          .set({ ...patch, updatedAt: new Date() })
          .where(eq(contacts.id, contact.id))
          .returning();
        contact = updated;
      }
    } else {
      const [created] = await tx
        .insert(contacts)
        .values({
          fullName: data.fullName ?? null,
          email,
          phone,
          countryCode: data.countryCode ?? '+63',
          firstSource: source,
        })
        .returning();
      contact = created;
    }

    // 2) Create the opportunity at New Lead.
    const [opportunity] = await tx
      .insert(opportunities)
      .values({
        contactId: contact.id,
        pipelineId,
        stageId: newLeadStage.id,
        title: buildOpportunityTitle(data.serviceType, contact.fullName, contact.phone),
        serviceType: data.serviceType ?? null,
        vehicleType: data.vehicleType ?? null,
        preferredDate,
        source,
        campaignId: campaign?.id ?? null,
      })
      .returning();

    // 3) Log the immutable submission.
    const [inquiry] = await tx
      .insert(inquiries)
      .values({
        contactId: contact.id,
        opportunityId: opportunity.id,
        source,
        serviceType: data.serviceType ?? null,
        vehicleType: data.vehicleType ?? null,
        preferredDate,
        addDriver: data.addDriver ?? false,
        message: data.message ?? null,
        tourTitle: data.tourTitle ?? null,
        vehicleName: data.vehicleName ?? null,
        rentalDays: data.rentalDays ?? null,
        pickupLocation: data.pickupLocation?.trim() || null,
        campaignId: campaign?.id ?? null,
        rawPayload: input.rawPayload as Record<string, unknown>,
        utm: data.utm ?? null,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      })
      .returning({ id: inquiries.id });

    await logActivity(
      {
        opportunityId: opportunity.id,
        contactId: contact.id,
        type: 'system',
        subject: 'Opportunity created',
        body: campaign
          ? `Inquiry received from the “${campaign.name}” promo page`
          : `Inquiry received from ${source}`,
        metadata: {
          inquiryId: inquiry.id,
          source,
          campaignId: campaign?.id ?? null,
          campaignName: campaign?.name ?? null,
        },
      },
      tx
    );

    return {
      contactId: contact.id,
      opportunityId: opportunity.id,
      inquiryId: inquiry.id,
      isReturningCustomer: Boolean(existing),
    };
  });

  // Attribution and automations run outside the transaction — neither should be
  // able to undo a captured lead.
  if (data.referralCode) {
    await linkReferral({
      code: data.referralCode,
      refereeContactId: result.contactId,
      refereeOpportunityId: result.opportunityId,
    }).catch((error) => console.error('[intake] referral linking failed:', error));
  }

  if (!input.skipAutomations) {
    await handleInquiryCreated({
      opportunityId: result.opportunityId,
      contactId: result.contactId,
      inquiryId: result.inquiryId,
    }).catch((error) => console.error('[intake] W1 enrollment failed:', error));
  }

  return result;
}

/**
 * §7A — ties a submission back to the customer whose /r/[code] link brought it
 * in. Self-referrals are recorded but flagged; W5 voids them at payout time.
 *
 * The friend's ₱300 is issued here, at sign-up, rather than at conversion like
 * the referrer's ₱500. The two sides are earned at different moments: the
 * friend was promised "₱300 off your first booking" on the landing page they
 * just filled in, so it has to be on the *first* quote an agent builds them —
 * which is usually within the hour. The referrer's is a reward for an outcome
 * that has not happened yet, so it waits for the booking and for approval.
 */
export async function linkReferral(params: {
  code: string;
  refereeContactId: string;
  refereeOpportunityId: string;
  channel?: string | null;
}): Promise<void> {
  const code = params.code.trim().toUpperCase();

  const [referrer] = await db
    .select({ id: contacts.id })
    .from(contacts)
    .where(and(eq(contacts.referralCode, code), isNotNull(contacts.referralCode)))
    .limit(1);

  if (!referrer || referrer.id === params.refereeContactId) return;

  await db
    .update(contacts)
    .set({ referredByContactId: referrer.id, updatedAt: new Date() })
    .where(and(eq(contacts.id, params.refereeContactId), isNull(contacts.referredByContactId)));

  // Already tracking this exact pair? Just advance it.
  const [existing] = await db
    .select({ id: referrals.id })
    .from(referrals)
    .where(
      and(
        eq(referrals.referrerContactId, referrer.id),
        eq(referrals.refereeContactId, params.refereeContactId)
      )
    )
    .limit(1);

  if (existing) {
    await db
      .update(referrals)
      .set({ status: 'signed_up', refereeOpportunityId: params.refereeOpportunityId })
      .where(eq(referrals.id, existing.id));
    // No credit: this pair is already tracked, so one was issued the first time.
    return;
  }

  // Otherwise claim the unattributed row that /r/[code] created when this
  // visitor first clicked, so one referral isn't counted as two.
  const [unclaimed] = await db
    .select({ id: referrals.id })
    .from(referrals)
    .where(
      and(
        eq(referrals.referrerContactId, referrer.id),
        eq(referrals.code, code),
        isNull(referrals.refereeContactId)
      )
    )
    .orderBy(referrals.createdAt)
    .limit(1);

  if (unclaimed) {
    await db
      .update(referrals)
      .set({
        refereeContactId: params.refereeContactId,
        refereeOpportunityId: params.refereeOpportunityId,
        status: 'signed_up',
        ...(params.channel ? { channel: params.channel } : {}),
      })
      .where(eq(referrals.id, unclaimed.id));

    await issueRefereeCredit(unclaimed.id, params.refereeContactId);
    return;
  }

  const [created] = await db
    .insert(referrals)
    .values({
      referrerContactId: referrer.id,
      refereeContactId: params.refereeContactId,
      refereeOpportunityId: params.refereeOpportunityId,
      code,
      channel: params.channel ?? null,
      status: 'signed_up',
    })
    .returning({ id: referrals.id });

  await issueRefereeCredit(created.id, params.refereeContactId);
}

/**
 * The friend's welcome discount.
 *
 * Failure is logged and swallowed: this runs after the lead is already
 * committed, and an agent can re-issue a credit by hand far more easily than a
 * customer can re-submit a form they think went through.
 */
async function issueRefereeCredit(referralId: string, refereeContactId: string): Promise<void> {
  await issueCredit({
    contactId: refereeContactId,
    referralId,
    amount: REFEREE_CREDIT_AMOUNT,
    reason: REFEREE_REWARD_LABEL,
  }).catch((error) => console.error('[intake] referee credit failed:', error));
}
