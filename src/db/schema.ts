/**
 * Drizzle Schema — EasyRideCebu funnel / CRM
 *
 * Mirrors the DDL in docs/CRM_FUNNEL_IMPLEMENTATION_PLAN.md §5 and §7A.4.
 * The mental model is GoHighLevel's:
 *   contact (the person) → inquiry (one immutable form submission)
 *                        → opportunity (the mutable deal moving through stages)
 *
 * Emails are stored lower-cased by the application layer instead of using the
 * CITEXT extension, so the schema stays portable across Postgres hosts.
 */

import { sql } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';

// --- Enums -----------------------------------------------------------------

export const adminRoleEnum = pgEnum('admin_role', ['owner', 'admin', 'agent']);

export const oppStatusEnum = pgEnum('opp_status', ['open', 'won', 'lost', 'abandoned']);

export const activityTypeEnum = pgEnum('activity_type', [
  'note',
  'stage_change',
  'message_out',
  'message_in',
  'call',
  'email',
  'task_created',
  'task_completed',
  'workflow',
  'system',
]);

export const taskStatusEnum = pgEnum('task_status', ['open', 'done', 'cancelled']);

export const enrollmentStatusEnum = pgEnum('enrollment_status', [
  'active',
  'paused',
  'completed',
  'exited',
  'failed',
]);

export const referralStatusEnum = pgEnum('referral_status', [
  'pending',
  'clicked',
  'signed_up',
  'booked',
  'rewarded',
  'void',
]);

// --- Admin users (portal login) --------------------------------------------

export const adminUsers = pgTable(
  'admin_users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    name: text('name').notNull(),
    role: adminRoleEnum('role').notNull().default('agent'),
    isActive: boolean('is_active').notNull().default(true),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('admin_users_email_uidx').on(table.email)]
);

// --- Contacts (people) ------------------------------------------------------

export const contacts = pgTable(
  'contacts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    fullName: text('full_name'),
    email: text('email'),
    /** Normalized E.164, e.g. +639178046988 */
    phone: text('phone'),
    countryCode: text('country_code').default('+63'),
    tags: text('tags')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    lifetimeValue: numeric('lifetime_value', { precision: 12, scale: 2 }).notNull().default('0'),
    firstSource: text('first_source'),
    notes: text('notes'),
    /** §7A — the customer's own share code, e.g. 'JUAN-7QK2' */
    referralCode: text('referral_code'),
    referredByContactId: uuid('referred_by_contact_id').references((): AnyPgColumn => contacts.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('contacts_phone_uidx')
      .on(table.phone)
      .where(sql`${table.phone} is not null`),
    uniqueIndex('contacts_referral_code_uidx')
      .on(table.referralCode)
      .where(sql`${table.referralCode} is not null`),
    index('contacts_email_idx').on(table.email),
  ]
);

// --- Pipelines & stages (the funnel definition) -----------------------------

export const pipelines = pgTable('pipelines', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const pipelineStages = pgTable(
  'pipeline_stages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    pipelineId: uuid('pipeline_id')
      .notNull()
      .references(() => pipelines.id, { onDelete: 'cascade' }),
    /** 'new_lead', 'contacted', ... — stable identifier used by the workflow engine */
    key: text('key').notNull(),
    name: text('name').notNull(),
    sortOrder: integer('sort_order').notNull(),
    /** 0..100, drives the weighted forecast */
    probability: integer('probability').notNull().default(0),
    isWon: boolean('is_won').notNull().default(false),
    isLost: boolean('is_lost').notNull().default(false),
  },
  (table) => [uniqueIndex('pipeline_stages_pipeline_key_uidx').on(table.pipelineId, table.key)]
);

// --- Opportunities (deals moving through the funnel) ------------------------

export const opportunities = pgTable(
  'opportunities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    contactId: uuid('contact_id')
      .notNull()
      .references(() => contacts.id, { onDelete: 'cascade' }),
    pipelineId: uuid('pipeline_id')
      .notNull()
      .references(() => pipelines.id),
    stageId: uuid('stage_id')
      .notNull()
      .references(() => pipelineStages.id),
    ownerId: uuid('owner_id').references(() => adminUsers.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    status: oppStatusEnum('status').notNull().default('open'),
    serviceType: text('service_type'),
    vehicleType: text('vehicle_type'),
    monetaryValue: numeric('monetary_value', { precision: 12, scale: 2 }).notNull().default('0'),
    currency: text('currency').notNull().default('PHP'),
    preferredDate: date('preferred_date'),
    source: text('source'),
    lostReason: text('lost_reason'),
    expectedCloseDate: date('expected_close_date'),
    wonAt: timestamp('won_at', { withTimezone: true }),
    lostAt: timestamp('lost_at', { withTimezone: true }),
    /** Set when the stage last changed — powers the "idle lead" drip and speed-to-lead metric */
    stageChangedAt: timestamp('stage_changed_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('opportunities_stage_idx').on(table.stageId),
    index('opportunities_status_idx').on(table.status),
    index('opportunities_owner_idx').on(table.ownerId),
    index('opportunities_created_idx').on(table.createdAt.desc()),
  ]
);

// --- Inquiries (immutable form submissions) ---------------------------------

export const inquiries = pgTable(
  'inquiries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    contactId: uuid('contact_id')
      .notNull()
      .references(() => contacts.id, { onDelete: 'cascade' }),
    opportunityId: uuid('opportunity_id').references(() => opportunities.id, {
      onDelete: 'set null',
    }),
    source: text('source').notNull(),
    serviceType: text('service_type'),
    vehicleType: text('vehicle_type'),
    preferredDate: date('preferred_date'),
    addDriver: boolean('add_driver').notNull().default(false),
    message: text('message'),
    tourTitle: text('tour_title'),
    /** The exact posted body — future-proofs us against form changes */
    rawPayload: jsonb('raw_payload').notNull(),
    utm: jsonb('utm'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('inquiries_created_idx').on(table.createdAt.desc()),
    index('inquiries_source_idx').on(table.source),
    index('inquiries_opportunity_idx').on(table.opportunityId),
  ]
);

// --- Activities (the per-inquiry timeline) ----------------------------------

export const activities = pgTable(
  'activities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    opportunityId: uuid('opportunity_id').references(() => opportunities.id, {
      onDelete: 'cascade',
    }),
    contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'cascade' }),
    /** NULL = system / automation */
    adminUserId: uuid('admin_user_id').references(() => adminUsers.id, { onDelete: 'set null' }),
    type: activityTypeEnum('type').notNull(),
    channel: text('channel'),
    subject: text('subject'),
    body: text('body'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('activities_opp_idx').on(table.opportunityId, table.createdAt.desc())]
);

// --- Tasks (follow-up to-dos) -----------------------------------------------

export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    opportunityId: uuid('opportunity_id').references(() => opportunities.id, {
      onDelete: 'cascade',
    }),
    contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'cascade' }),
    assignedTo: uuid('assigned_to').references(() => adminUsers.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    dueAt: timestamp('due_at', { withTimezone: true }),
    status: taskStatusEnum('status').notNull().default('open'),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('tasks_due_idx').on(table.assignedTo, table.status, table.dueAt)]
);

// --- Workflows (automation definitions) -------------------------------------

export const workflows = pgTable(
  'workflows',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** 'w1_intake', 'w2_followup', ... */
    key: text('key').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    /** inquiry.created | stage.changed | referral.converted | schedule */
    triggerType: text('trigger_type').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    /** Ordered steps — see src/lib/workflows/definitions.ts */
    definition: jsonb('definition').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('workflows_key_uidx').on(table.key)]
);

// --- Workflow enrollments (a lead's progress through a workflow) ------------

export const workflowEnrollments = pgTable(
  'workflow_enrollments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workflowId: uuid('workflow_id')
      .notNull()
      .references(() => workflows.id, { onDelete: 'cascade' }),
    opportunityId: uuid('opportunity_id')
      .notNull()
      .references(() => opportunities.id, { onDelete: 'cascade' }),
    contactId: uuid('contact_id')
      .notNull()
      .references(() => contacts.id, { onDelete: 'cascade' }),
    status: enrollmentStatusEnum('status').notNull().default('active'),
    currentStep: integer('current_step').notNull().default(0),
    /** When the runner should process the next step */
    nextRunAt: timestamp('next_run_at', { withTimezone: true }),
    context: jsonb('context')
      .notNull()
      .default(sql`'{}'::jsonb`),
    enrolledAt: timestamp('enrolled_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => [
    index('enrollments_due_idx').on(table.status, table.nextRunAt),
    index('enrollments_opp_idx').on(table.opportunityId),
  ]
);

// --- Referrals (§7A) --------------------------------------------------------

export const referrals = pgTable(
  'referrals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    referrerContactId: uuid('referrer_contact_id')
      .notNull()
      .references(() => contacts.id, { onDelete: 'cascade' }),
    /** Set when the friend actually submits an inquiry */
    refereeContactId: uuid('referee_contact_id').references(() => contacts.id, {
      onDelete: 'set null',
    }),
    refereeOpportunityId: uuid('referee_opportunity_id').references(() => opportunities.id, {
      onDelete: 'set null',
    }),
    /** The /r/[code] that was used */
    code: text('code').notNull(),
    channel: text('channel'),
    status: referralStatusEnum('status').notNull().default('pending'),
    referrerReward: text('referrer_reward'),
    refereeReward: text('referee_reward'),
    rewardPaidAt: timestamp('reward_paid_at', { withTimezone: true }),
    /** Set by the W5 guardrails when a referral looks like self-dealing */
    abuseFlag: text('abuse_flag'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    convertedAt: timestamp('converted_at', { withTimezone: true }),
  },
  (table) => [
    index('referrals_referrer_idx').on(table.referrerContactId),
    index('referrals_status_idx').on(table.status),
    index('referrals_code_idx').on(table.code),
  ]
);

// --- Reviews / feedback (§7A) -----------------------------------------------

export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    contactId: uuid('contact_id')
      .notNull()
      .references(() => contacts.id, { onDelete: 'cascade' }),
    opportunityId: uuid('opportunity_id').references(() => opportunities.id, {
      onDelete: 'set null',
    }),
    /** 1..5 stars; nullable when only NPS was captured */
    rating: integer('rating'),
    nps: integer('nps'),
    comment: text('comment'),
    isPromoter: boolean('is_promoter'),
    /** True once the customer clicked out to Google / Facebook */
    leftPublic: boolean('left_public').notNull().default(false),
    publicChannel: text('public_channel'),
    /** Admin approved → render on the landing page */
    isPublished: boolean('is_published').notNull().default(false),
    /** The /review/[token] value */
    token: text('token').notNull(),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('reviews_token_uidx').on(table.token),
    index('reviews_contact_idx').on(table.contactId),
    index('reviews_published_idx').on(table.isPublished),
  ]
);

// --- Inferred types ---------------------------------------------------------

export type AdminUser = typeof adminUsers.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
export type Pipeline = typeof pipelines.$inferSelect;
export type PipelineStage = typeof pipelineStages.$inferSelect;
export type Opportunity = typeof opportunities.$inferSelect;
export type Inquiry = typeof inquiries.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Workflow = typeof workflows.$inferSelect;
export type WorkflowEnrollment = typeof workflowEnrollments.$inferSelect;
export type Referral = typeof referrals.$inferSelect;
export type Review = typeof reviews.$inferSelect;
