/**
 * The automation runner — plan §12.
 *
 * Event-based triggers (W1 on `inquiry.created`, W3/W4 on `stage.changed`) call
 * in directly so instant actions stay instant; `wait` steps park the enrollment
 * with a `next_run_at` and the Vercel Cron route resumes them later.
 *
 * Every action writes an `activities` row, so the per-inquiry timeline is a
 * complete audit log of what the robots did on your behalf.
 */

import 'server-only';

import { and, eq, gt, inArray, isNotNull, lte, sql } from 'drizzle-orm';

import { db, type DbExecutor } from '@/db/client';
import {
  activities,
  contacts,
  opportunities,
  referrals,
  reviews,
  tasks,
  workflowEnrollments,
  workflows,
  type Contact,
  type Opportunity,
  type WorkflowEnrollment,
} from '@/db/schema';
import { stageRank, type StageKey } from '@/lib/funnel/stages';
import { deliverMessage } from '@/lib/messaging';
import {
  buildTemplateContext,
  ensureReferralCode,
  ensureReviewToken,
  getStageById,
  getStageByKey,
  logActivity,
} from '@/lib/crm/repository';
import { truncate } from '@/lib/crm/normalize';
import {
  REFEREE_REWARD,
  REFERRAL_MONTHLY_CAP,
  REFERRER_REWARD,
} from '@/lib/crm/rewards';
import {
  getWorkflowDefinition,
  workflowsForStage,
  type WorkflowCondition,
  type WorkflowDefinition,
  type WorkflowKey,
  type WorkflowStep,
} from './definitions';

/** Ceiling on steps executed per enrollment per invocation — cheap infinite-loop guard. */
const MAX_STEPS_PER_RUN = 25;

// --- Enrollment -------------------------------------------------------------

export interface EnrollInput {
  workflowKey: WorkflowKey;
  opportunityId: string;
  contactId: string;
  context?: Record<string, unknown>;
  /** Run the first steps immediately instead of waiting for the next cron tick. */
  runNow?: boolean;
}

/**
 * Enrols an opportunity into a workflow. No-ops when the workflow is switched
 * off, or when this opportunity is already actively enrolled in it.
 */
export async function enrollWorkflow(input: EnrollInput): Promise<string | null> {
  const [workflow] = await db
    .select()
    .from(workflows)
    .where(eq(workflows.key, input.workflowKey))
    .limit(1);

  if (!workflow) {
    console.warn(`[workflows] "${input.workflowKey}" is not seeded — skipping enrollment.`);
    return null;
  }
  if (!workflow.isActive) return null;

  const [existing] = await db
    .select({ id: workflowEnrollments.id })
    .from(workflowEnrollments)
    .where(
      and(
        eq(workflowEnrollments.workflowId, workflow.id),
        eq(workflowEnrollments.opportunityId, input.opportunityId),
        inArray(workflowEnrollments.status, ['active', 'paused'])
      )
    )
    .limit(1);

  if (existing) return existing.id;

  const [enrollment] = await db
    .insert(workflowEnrollments)
    .values({
      workflowId: workflow.id,
      opportunityId: input.opportunityId,
      contactId: input.contactId,
      status: 'active',
      currentStep: 0,
      nextRunAt: new Date(),
      context: input.context ?? {},
    })
    .returning({ id: workflowEnrollments.id });

  await logActivity({
    opportunityId: input.opportunityId,
    contactId: input.contactId,
    type: 'workflow',
    subject: `Enrolled in ${workflow.name}`,
    metadata: { workflowKey: input.workflowKey, enrollmentId: enrollment.id },
  });

  if (input.runNow !== false) {
    await runEnrollment(enrollment.id);
  }

  return enrollment.id;
}

// --- Event entry points -----------------------------------------------------

/** Called by the intake route once the contact/inquiry/opportunity exist. */
export async function handleInquiryCreated(params: {
  opportunityId: string;
  contactId: string;
  inquiryId: string;
}): Promise<void> {
  await enrollWorkflow({
    workflowKey: 'w1_intake',
    opportunityId: params.opportunityId,
    contactId: params.contactId,
    context: { inquiryId: params.inquiryId },
    runNow: true,
  });
}

/**
 * Called after any stage change (agent-driven or automated). Enrols whichever
 * workflows list this stage as their trigger.
 */
export async function handleStageChanged(params: {
  opportunityId: string;
  contactId: string;
  stage: StageKey;
}): Promise<void> {
  for (const definition of workflowsForStage(params.stage)) {
    await enrollWorkflow({
      workflowKey: definition.key,
      opportunityId: params.opportunityId,
      contactId: params.contactId,
      runNow: true,
    });
  }
}

/** §7A.7 — a referred friend's deal reached Booked. */
export async function handleReferralConverted(params: {
  opportunityId: string;
  contactId: string;
  referralId: string;
}): Promise<void> {
  await enrollWorkflow({
    workflowKey: 'w5_referral_reward',
    opportunityId: params.opportunityId,
    contactId: params.contactId,
    context: { referralId: params.referralId },
    runNow: true,
  });
}

// --- The runner -------------------------------------------------------------

export interface RunResult {
  enrollmentId: string;
  stepsExecuted: number;
  status: WorkflowEnrollment['status'];
}

/** Processes every enrollment whose `next_run_at` has come due (the cron path). */
export async function processDueEnrollments(limit = 50): Promise<RunResult[]> {
  const due = await db
    .select({ id: workflowEnrollments.id })
    .from(workflowEnrollments)
    .where(
      and(
        eq(workflowEnrollments.status, 'active'),
        isNotNull(workflowEnrollments.nextRunAt),
        lte(workflowEnrollments.nextRunAt, new Date())
      )
    )
    .orderBy(workflowEnrollments.nextRunAt)
    .limit(limit);

  const results: RunResult[] = [];
  for (const row of due) {
    try {
      results.push(await runEnrollment(row.id));
    } catch (error) {
      console.error(`[workflows] enrollment ${row.id} failed:`, error);
      await db
        .update(workflowEnrollments)
        .set({ status: 'failed', nextRunAt: null })
        .where(eq(workflowEnrollments.id, row.id));
      results.push({ enrollmentId: row.id, stepsExecuted: 0, status: 'failed' });
    }
  }

  return results;
}

interface StepOutcome {
  /** Park the enrollment until this time and stop for now. */
  parkUntil?: Date;
  /** Leave the workflow cleanly. */
  exit?: boolean;
  /** Reason recorded on the timeline when exiting. */
  exitReason?: string;
}

/**
 * Advances one enrollment as far as it can go: runs steps until it hits a wait,
 * an exit condition, or the end of the definition.
 */
export async function runEnrollment(enrollmentId: string): Promise<RunResult> {
  let stepsExecuted = 0;

  for (let iteration = 0; iteration < MAX_STEPS_PER_RUN; iteration += 1) {
    const [enrollment] = await db
      .select()
      .from(workflowEnrollments)
      .where(eq(workflowEnrollments.id, enrollmentId))
      .limit(1);

    if (!enrollment) {
      return { enrollmentId, stepsExecuted, status: 'exited' };
    }
    if (enrollment.status !== 'active') {
      return { enrollmentId, stepsExecuted, status: enrollment.status };
    }
    // Parked and not yet due — leave it for a later cron tick.
    if (enrollment.nextRunAt && enrollment.nextRunAt.getTime() > Date.now()) {
      return { enrollmentId, stepsExecuted, status: 'active' };
    }

    const [workflowRow] = await db
      .select()
      .from(workflows)
      .where(eq(workflows.id, enrollment.workflowId))
      .limit(1);

    const definition =
      getWorkflowDefinition(workflowRow?.key ?? '') ??
      (workflowRow?.definition as WorkflowDefinition | undefined);

    if (!workflowRow || !definition) {
      await finishEnrollment(enrollment, 'failed', 'Workflow definition missing');
      return { enrollmentId, stepsExecuted, status: 'failed' };
    }

    if (!workflowRow.isActive) {
      await finishEnrollment(enrollment, 'exited', 'Workflow switched off');
      return { enrollmentId, stepsExecuted, status: 'exited' };
    }

    const subject = await loadSubject(enrollment.opportunityId);
    if (!subject) {
      await finishEnrollment(enrollment, 'exited', 'Opportunity no longer exists');
      return { enrollmentId, stepsExecuted, status: 'exited' };
    }

    // Global exit conditions run before every step.
    for (const condition of definition.exitWhen) {
      if (await evaluateCondition(condition, subject, enrollment)) {
        await finishEnrollment(enrollment, 'exited', describeCondition(condition));
        return { enrollmentId, stepsExecuted, status: 'exited' };
      }
    }

    const step = definition.steps[enrollment.currentStep];
    if (!step) {
      await finishEnrollment(enrollment, 'completed', 'All steps complete');
      return { enrollmentId, stepsExecuted, status: 'completed' };
    }

    const outcome = await executeStep(step, subject, enrollment, definition);
    stepsExecuted += 1;

    const nextStepIndex = enrollment.currentStep + 1;

    if (outcome.exit) {
      await finishEnrollment(
        { ...enrollment, currentStep: nextStepIndex },
        'exited',
        outcome.exitReason ?? 'Exit step'
      );
      return { enrollmentId, stepsExecuted, status: 'exited' };
    }

    await db
      .update(workflowEnrollments)
      .set({
        currentStep: nextStepIndex,
        nextRunAt: outcome.parkUntil ?? new Date(),
      })
      .where(eq(workflowEnrollments.id, enrollmentId));

    if (outcome.parkUntil) {
      return { enrollmentId, stepsExecuted, status: 'active' };
    }
  }

  return { enrollmentId, stepsExecuted, status: 'active' };
}

async function finishEnrollment(
  enrollment: WorkflowEnrollment,
  status: 'completed' | 'exited' | 'failed',
  reason: string
): Promise<void> {
  await db
    .update(workflowEnrollments)
    .set({
      status,
      nextRunAt: null,
      completedAt: new Date(),
      currentStep: enrollment.currentStep,
    })
    .where(eq(workflowEnrollments.id, enrollment.id));

  await logActivity({
    opportunityId: enrollment.opportunityId,
    contactId: enrollment.contactId,
    type: 'workflow',
    subject: `Automation ${status}`,
    body: reason,
    metadata: { enrollmentId: enrollment.id, status },
  });
}

// --- Subject (the opportunity a workflow is acting on) ----------------------

interface WorkflowSubject {
  opportunity: Opportunity;
  contact: Contact;
  stageKey: string;
}

async function loadSubject(opportunityId: string): Promise<WorkflowSubject | undefined> {
  const [row] = await db
    .select({ opportunity: opportunities, contact: contacts })
    .from(opportunities)
    .innerJoin(contacts, eq(contacts.id, opportunities.contactId))
    .where(eq(opportunities.id, opportunityId))
    .limit(1);

  if (!row) return undefined;

  const stage = await getStageById(row.opportunity.stageId);
  return {
    opportunity: row.opportunity,
    contact: row.contact,
    stageKey: stage?.key ?? 'new_lead',
  };
}

// --- Conditions -------------------------------------------------------------

function describeCondition(condition: WorkflowCondition): string {
  switch (condition.kind) {
    case 'stage_at_or_beyond':
      return `Deal reached ${condition.stage}`;
    case 'stage_is':
      return `Deal is at ${condition.stage}`;
    default:
      return `Condition "${condition.kind}" met`;
  }
}

async function evaluateCondition(
  condition: WorkflowCondition,
  subject: WorkflowSubject,
  enrollment: WorkflowEnrollment
): Promise<boolean> {
  const { opportunity, stageKey } = subject;

  switch (condition.kind) {
    case 'closed':
      return opportunity.status !== 'open';

    case 'won':
      return opportunity.status === 'won' || stageKey === 'booked';

    case 'lost':
      return opportunity.status === 'lost' || stageKey === 'lost';

    case 'stage_is':
      return stageKey === condition.stage;

    case 'stage_at_or_beyond':
      // "Lost" sorts last but is terminal, not "further along" — treat it separately.
      if (stageKey === 'lost') return condition.stage === 'lost';
      return stageRank(stageKey) >= stageRank(condition.stage);

    case 'contacted': {
      if (stageKey !== 'new_lead' && stageKey !== 'lost') return true;
      const [humanTouch] = await db
        .select({ id: activities.id })
        .from(activities)
        .where(
          and(
            eq(activities.opportunityId, opportunity.id),
            isNotNull(activities.adminUserId),
            inArray(activities.type, ['call', 'message_out', 'email', 'note'])
          )
        )
        .limit(1);
      return Boolean(humanTouch);
    }

    case 'replied': {
      const [inbound] = await db
        .select({ id: activities.id })
        .from(activities)
        .where(
          and(
            eq(activities.opportunityId, opportunity.id),
            inArray(activities.type, ['message_in', 'call']),
            gt(activities.createdAt, enrollment.enrolledAt)
          )
        )
        .limit(1);
      return Boolean(inbound);
    }

    case 'is_promoter':
    case 'not_promoter': {
      const [review] = await db
        .select({ isPromoter: reviews.isPromoter })
        .from(reviews)
        .where(and(eq(reviews.contactId, subject.contact.id), eq(reviews.isPromoter, true)))
        .limit(1);
      const isPromoter = Boolean(review);
      return condition.kind === 'is_promoter' ? isPromoter : !isPromoter;
    }

    default:
      return false;
  }
}

// --- Step handlers ----------------------------------------------------------

function interpolate(value: string, subject: WorkflowSubject): string {
  return value
    .replace(/\{\{source\}\}/g, subject.opportunity.source ?? 'unknown')
    .replace(/\{\{serviceType\}\}/g, subject.opportunity.serviceType ?? 'unknown')
    .replace(/\{\{vehicleType\}\}/g, subject.opportunity.vehicleType ?? 'unknown');
}

function addDuration(step: Extract<WorkflowStep, { type: 'wait' }>): Date {
  const ms =
    (step.minutes ?? 0) * 60_000 + (step.hours ?? 0) * 3_600_000 + (step.days ?? 0) * 86_400_000;
  return new Date(Date.now() + Math.max(ms, 60_000));
}

async function executeStep(
  step: WorkflowStep,
  subject: WorkflowSubject,
  enrollment: WorkflowEnrollment,
  definition: WorkflowDefinition
): Promise<StepOutcome> {
  const { opportunity, contact } = subject;

  switch (step.type) {
    // Intake already did these transactionally; they exist in the definition so
    // the stored JSON reads like the flowchart in the plan.
    case 'upsert_contact':
    case 'create_opportunity':
      return {};

    case 'send_message': {
      // These templates only work if the link they point at already exists.
      if (step.template === 'review_request') {
        await ensureReviewToken(opportunity.id, contact.id);
      }
      if (step.template === 'referral_invite' || step.template === 're_engagement_90') {
        await ensureReferralCode(contact);
      }

      // Re-read the contact so a code minted a moment ago lands in the context.
      const [freshContact] = await db
        .select()
        .from(contacts)
        .where(eq(contacts.id, contact.id))
        .limit(1);

      const context = await buildTemplateContext(opportunity, freshContact ?? contact);
      const result = await deliverMessage({
        channel: step.channel,
        template: step.template,
        context,
        audience: step.to ?? 'customer',
      });

      await logActivity({
        opportunityId: opportunity.id,
        contactId: contact.id,
        type: 'message_out',
        channel: result.channel,
        subject: `${definition.name} · ${result.subject}`,
        body: truncate(result.body, 2000),
        metadata: {
          template: step.template,
          delivered: result.delivered,
          provider: result.provider,
          link: result.link ?? null,
          error: result.error ?? null,
          automated: true,
        },
      });
      return {};
    }

    case 'notify_admin': {
      const context = await buildTemplateContext(opportunity, contact);
      const result = await deliverMessage({
        channel: 'email',
        template: step.template,
        context,
        audience: 'admin',
      });

      await logActivity({
        opportunityId: opportunity.id,
        contactId: contact.id,
        type: 'workflow',
        channel: 'email',
        subject: `${definition.name} · admin alert`,
        body: truncate(result.body, 2000),
        metadata: {
          template: step.template,
          delivered: result.delivered,
          error: result.error ?? null,
        },
      });
      return {};
    }

    case 'create_task': {
      const dueAt = step.dueInMinutes ? new Date(Date.now() + step.dueInMinutes * 60_000) : null;
      const [task] = await db
        .insert(tasks)
        .values({
          opportunityId: opportunity.id,
          contactId: contact.id,
          assignedTo: opportunity.ownerId,
          title: step.title,
          dueAt,
        })
        .returning({ id: tasks.id });

      await logActivity({
        opportunityId: opportunity.id,
        contactId: contact.id,
        type: 'task_created',
        subject: step.title,
        body: dueAt ? `Due ${dueAt.toISOString()}` : null,
        metadata: { taskId: task.id, automated: true, workflow: definition.key },
      });
      return {};
    }

    case 'add_tags': {
      const nextTags = step.tags.map((tag) => interpolate(tag, subject));
      const merged = Array.from(new Set([...(contact.tags ?? []), ...nextTags]));
      await db
        .update(contacts)
        .set({ tags: merged, updatedAt: new Date() })
        .where(eq(contacts.id, contact.id));
      return {};
    }

    case 'wait':
      return { parkUntil: addDuration(step) };

    case 'wait_until_trip_date': {
      const fallback = new Date(Date.now() + (step.fallbackDays ?? 3) * 86_400_000);
      if (!opportunity.preferredDate) return { parkUntil: fallback };

      const tripDate = new Date(`${opportunity.preferredDate}T09:00:00Z`);
      const target = new Date(tripDate.getTime() + (step.offsetHours ?? 0) * 3_600_000);
      // A trip date already in the past means this step is due right now.
      return { parkUntil: target.getTime() > Date.now() ? target : new Date(Date.now() + 60_000) };
    }

    case 'exit_if': {
      const matched = await evaluateCondition(step.condition, subject, enrollment);
      return matched ? { exit: true, exitReason: describeCondition(step.condition) } : {};
    }

    case 'move_stage':
      await moveStage({
        opportunity,
        contact,
        stage: step.stage,
        lostReason: step.lostReason,
        actor: definition.name,
      });
      return {};

    case 'enroll':
      await enrollWorkflow({
        workflowKey: step.workflow,
        opportunityId: opportunity.id,
        contactId: contact.id,
        // Defer to the next tick so W1 returns to the visitor fast.
        runNow: false,
      });
      return {};

    case 'update_lifetime_value':
      await recalculateLifetimeValue(contact.id);
      return {};

    case 'issue_referral_rewards':
      await issueReferralRewards(opportunity, contact);
      return {};

    case 'exit':
      return { exit: true, exitReason: 'Workflow finished' };

    default:
      return {};
  }
}

// --- Shared mutations -------------------------------------------------------

export interface MoveStageInput {
  opportunity: Opportunity;
  contact: Contact;
  stage: StageKey;
  lostReason?: string | null;
  /** Admin user id when a person did it; omit for automations. */
  adminUserId?: string | null;
  /** Label shown on the timeline ("Joseph" or "W3 · Quote → Booking"). */
  actor?: string;
}

/**
 * The single place a stage changes. Keeps status/won_at/lost_at consistent,
 * writes the timeline entry, and fires any stage-triggered workflows.
 */
export async function moveStage(input: MoveStageInput): Promise<void> {
  const { opportunity, contact } = input;
  const fromStage = await getStageById(opportunity.stageId);
  const toStage = await getStageByKey(input.stage);

  if (fromStage?.id === toStage.id) return;

  const now = new Date();
  const status = toStage.isWon ? 'won' : toStage.isLost ? 'lost' : 'open';

  await db
    .update(opportunities)
    .set({
      stageId: toStage.id,
      status,
      stageChangedAt: now,
      updatedAt: now,
      wonAt: toStage.isWon ? (opportunity.wonAt ?? now) : opportunity.wonAt,
      lostAt: toStage.isLost ? (opportunity.lostAt ?? now) : opportunity.lostAt,
      lostReason: toStage.isLost ? (input.lostReason ?? opportunity.lostReason) : opportunity.lostReason,
    })
    .where(eq(opportunities.id, opportunity.id));

  await logActivity({
    opportunityId: opportunity.id,
    contactId: contact.id,
    adminUserId: input.adminUserId ?? null,
    type: 'stage_change',
    subject: `${fromStage?.name ?? 'Unknown'} → ${toStage.name}`,
    body: input.lostReason ?? null,
    metadata: {
      from: fromStage?.key ?? null,
      to: toStage.key,
      actor: input.actor ?? 'System',
    },
  });

  // Winning or un-winning a deal changes what the customer is worth. Doing it
  // here rather than in each caller means every path — agent click, kanban
  // drag, quote acceptance, automation — keeps lifetime value honest.
  await recalculateLifetimeValue(contact.id);

  // Retire any automation this stage change has made pointless *now*, rather
  // than leaving it showing as "running" until its next wait elapses.
  await applyExitConditions(opportunity.id);

  await handleStageChanged({
    opportunityId: opportunity.id,
    contactId: contact.id,
    stage: toStage.key as StageKey,
  });

  // §7A — a referred friend converting is what unlocks the referrer's reward.
  if (toStage.key === 'booked') {
    await maybeConvertReferral(opportunity, contact);
  }
}

/**
 * Re-evaluates every live enrollment's exit conditions for one opportunity,
 * including ones parked mid-wait. The cron runner does this on each pass
 * anyway; calling it after a stage change just makes the portal honest
 * immediately instead of at the next tick.
 */
export async function applyExitConditions(opportunityId: string): Promise<number> {
  const subject = await loadSubject(opportunityId);
  if (!subject) return 0;

  const rows = await db
    .select({ enrollment: workflowEnrollments, workflow: workflows })
    .from(workflowEnrollments)
    .innerJoin(workflows, eq(workflows.id, workflowEnrollments.workflowId))
    .where(
      and(
        eq(workflowEnrollments.opportunityId, opportunityId),
        inArray(workflowEnrollments.status, ['active', 'paused'])
      )
    );

  let exited = 0;

  for (const { enrollment, workflow } of rows) {
    const definition =
      getWorkflowDefinition(workflow.key) ?? (workflow.definition as WorkflowDefinition | undefined);
    if (!definition) continue;

    for (const condition of definition.exitWhen) {
      if (await evaluateCondition(condition, subject, enrollment)) {
        await finishEnrollment(enrollment, 'exited', describeCondition(condition));
        exited += 1;
        break;
      }
    }
  }

  return exited;
}

/** Lifetime value = everything this contact has actually won. */
export async function recalculateLifetimeValue(
  contactId: string,
  executor: DbExecutor = db
): Promise<void> {
  const [row] = await executor
    .select({ total: sql<string>`coalesce(sum(${opportunities.monetaryValue}), 0)` })
    .from(opportunities)
    .where(and(eq(opportunities.contactId, contactId), eq(opportunities.status, 'won')));

  await executor
    .update(contacts)
    .set({ lifetimeValue: row?.total ?? '0', updatedAt: new Date() })
    .where(eq(contacts.id, contactId));
}

/** Flips a pending referral to converted and starts W5. */
async function maybeConvertReferral(opportunity: Opportunity, contact: Contact): Promise<void> {
  const [referral] = await db
    .select()
    .from(referrals)
    .where(
      and(
        eq(referrals.refereeContactId, contact.id),
        inArray(referrals.status, ['pending', 'clicked', 'signed_up'])
      )
    )
    .limit(1);

  if (!referral) return;

  await db
    .update(referrals)
    .set({
      status: 'booked',
      refereeOpportunityId: opportunity.id,
      convertedAt: new Date(),
    })
    .where(eq(referrals.id, referral.id));

  await handleReferralConverted({
    opportunityId: opportunity.id,
    contactId: contact.id,
    referralId: referral.id,
  });
}

/**
 * W5's guardrails and reward assignment (§7A.3). Rewards are *assigned*, not
 * paid: an admin approves the payout in /admin/referrals, which is what flips
 * the row to 'rewarded'.
 */
async function issueReferralRewards(opportunity: Opportunity, contact: Contact): Promise<void> {
  const [referral] = await db
    .select()
    .from(referrals)
    .where(and(eq(referrals.refereeContactId, contact.id), eq(referrals.status, 'booked')))
    .limit(1);

  if (!referral) return;

  const [referrer] = await db
    .select()
    .from(contacts)
    .where(eq(contacts.id, referral.referrerContactId))
    .limit(1);

  if (!referrer) return;

  const selfReferral =
    referrer.id === contact.id ||
    (Boolean(referrer.phone) && referrer.phone === contact.phone) ||
    (Boolean(referrer.email) && referrer.email === contact.email);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000);
  const [{ count: recentRewards }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(referrals)
    .where(
      and(
        eq(referrals.referrerContactId, referrer.id),
        eq(referrals.status, 'rewarded'),
        gt(referrals.rewardPaidAt, thirtyDaysAgo)
      )
    );

  const overCap = recentRewards >= REFERRAL_MONTHLY_CAP;

  if (selfReferral || overCap) {
    const reason = selfReferral
      ? 'Self-referral: referrer and referee share contact details'
      : `Monthly cap reached (${REFERRAL_MONTHLY_CAP} rewards / 30 days)`;

    await db
      .update(referrals)
      .set({ status: 'void', abuseFlag: reason })
      .where(eq(referrals.id, referral.id));

    await logActivity({
      opportunityId: opportunity.id,
      contactId: contact.id,
      type: 'workflow',
      subject: 'Referral reward blocked',
      body: reason,
      metadata: { referralId: referral.id },
    });
    return;
  }

  await db
    .update(referrals)
    .set({ referrerReward: REFERRER_REWARD, refereeReward: REFEREE_REWARD })
    .where(eq(referrals.id, referral.id));

  await logActivity({
    opportunityId: opportunity.id,
    contactId: contact.id,
    type: 'workflow',
    subject: 'Referral reward pending approval',
    body: `Referrer ${referrer.fullName ?? referrer.phone ?? referrer.id} earns ${REFERRER_REWARD}; referee gets ${REFEREE_REWARD}.`,
    metadata: { referralId: referral.id, referrerId: referrer.id },
  });
}
