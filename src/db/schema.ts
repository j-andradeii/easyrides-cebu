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

// Relative, not '@/…': drizzle-kit and the tsx scripts load this file outside
// Next's module resolution, where the path alias is not available.
import type { ItineraryItem, TourPricingOptions } from '../types/tour';

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

export const quoteStatusEnum = pgEnum('quote_status', [
  'sent',
  'viewed',
  'accepted',
  'declined',
  'expired',
  'cancelled',
]);

/**
 * What a quote is asking to be paid.
 *
 * `full_payment` settles the whole booking; `partial_payment` is one
 * instalment of it, which is why several can be live on the same deal.
 */
export const quoteTypeEnum = pgEnum('quote_type', ['full_payment', 'partial_payment']);

/**
 * Where a payment sits in the "did the money actually arrive?" check.
 * `submitted` is what the customer claims; only a human moves it on.
 */
export const paymentStatusEnum = pgEnum('payment_status', [
  'submitted',
  'verified',
  'rejected',
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
    /** 'new_lead', 'quote_sent', ... — stable identifier used by the workflow engine */
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
    /**
     * The lead reference an agent reads out on the phone — "L-001042".
     *
     * Stored rather than derived from the id (the way `quoteReference()` slices
     * a UUID) for two reasons: a sequence cannot collide, whereas six hex chars
     * off a UUID start colliding around a few thousand rows; and a customer can
     * actually repeat this one back to you.
     *
     * Filled by a column DEFAULT reading `opportunities_reference_seq`, so
     * every insert path gets one — intake, the seed, the admin "Add lead"
     * dialog, and anything added later — without a single line of app code
     * needing to remember. See migration 0004.
     */
    reference: text('reference')
      .notNull()
      .unique()
      .default(sql`'L-' || lpad(nextval('opportunities_reference_seq')::text, 6, '0')`),
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

// --- Quotes (the tokenized checkout page a customer receives) ---------------

export const quotes = pgTable(
  'quotes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    opportunityId: uuid('opportunity_id')
      .notNull()
      .references(() => opportunities.id, { onDelete: 'cascade' }),
    contactId: uuid('contact_id')
      .notNull()
      .references(() => contacts.id, { onDelete: 'cascade' }),
    /** The unguessable /quote/[token] value. */
    token: text('token').notNull(),
    status: quoteStatusEnum('status').notNull().default('sent'),
    /** Whether this quote settles the booking or is one instalment of it. */
    quoteType: quoteTypeEnum('quote_type').notNull().default('full_payment'),
    currency: text('currency').notNull().default('PHP'),
    /** Ordered line items: [{ label, description, quantity, unitPrice, amount }] */
    lineItems: jsonb('line_items').notNull(),
    subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull().default('0'),
    discount: numeric('discount', { precision: 12, scale: 2 }).notNull().default('0'),
    total: numeric('total', { precision: 12, scale: 2 }).notNull().default('0'),
    /** Optional amount required up front to hold the booking. */
    depositAmount: numeric('deposit_amount', { precision: 12, scale: 2 }),
    notes: text('notes'),
    /** Quotes expire so stale prices and availability can't be held against us. */
    validUntil: timestamp('valid_until', { withTimezone: true }).notNull(),
    sentAt: timestamp('sent_at', { withTimezone: true }).notNull().defaultNow(),
    viewedAt: timestamp('viewed_at', { withTimezone: true }),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    declinedAt: timestamp('declined_at', { withTimezone: true }),
    declineReason: text('decline_reason'),
    /** Which payment method the customer picked on the checkout page. */
    paymentMethod: text('payment_method'),
    /** Reference / receipt number they typed in after paying. */
    paymentReference: text('payment_reference'),
    createdBy: uuid('created_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('quotes_token_uidx').on(table.token),
    index('quotes_opportunity_idx').on(table.opportunityId, table.createdAt.desc()),
    index('quotes_status_idx').on(table.status),
  ]
);

// --- Payments (what the customer says they sent) ----------------------------

/**
 * One row per payment a customer confirms on a quote page — including the
 * screenshot they upload as proof.
 *
 * A quote can be paid in instalments, so payments hang off the quote rather
 * than replacing its fields: the quote is the *price*, a payment is an
 * *attempt to settle it*. Nothing here is evidence on its own — the reference
 * number is typed by the customer and the screenshot is an image they chose —
 * which is why every row starts at `submitted` and needs a human to verify it.
 *
 * The proof image is stored in the database and served through an
 * admin-authenticated route rather than a public bucket: these are screenshots
 * of people's banking apps, and an unguessable public URL is still a public URL.
 */
export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    quoteId: uuid('quote_id')
      .notNull()
      .references(() => quotes.id, { onDelete: 'cascade' }),
    opportunityId: uuid('opportunity_id')
      .notNull()
      .references(() => opportunities.id, { onDelete: 'cascade' }),
    contactId: uuid('contact_id')
      .notNull()
      .references(() => contacts.id, { onDelete: 'cascade' }),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    currency: text('currency').notNull().default('PHP'),
    /** A key from `src/data/payment-methods.ts` — gcash, bpi, cash… */
    method: text('method').notNull(),
    /** The receipt / transaction number the customer typed in. */
    reference: text('reference'),
    status: paymentStatusEnum('status').notNull().default('submitted'),
    /** The screenshot, base64-encoded. Null when they didn't upload one. */
    proofData: text('proof_data'),
    proofMime: text('proof_mime'),
    proofFilename: text('proof_filename'),
    /** Bytes of the decoded image — for showing a size without decoding it. */
    proofSize: integer('proof_size'),
    reviewedBy: uuid('reviewed_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    /** Why it was verified or rejected — shown on the lead timeline. */
    reviewNote: text('review_note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('payments_created_idx').on(table.createdAt.desc()),
    index('payments_status_idx').on(table.status),
    index('payments_opportunity_idx').on(table.opportunityId),
    index('payments_quote_idx').on(table.quoteId),
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

// --- Tours (the public tour catalogue, editable from the portal) ------------

/**
 * One row per tour package — the same shape `src/data/tours.json` used to hold,
 * moved here so the portal can edit it. The JSON file stays in the repo as the
 * one-time import source (`npm run import-tours`), not as the live catalogue.
 *
 * `pricing` and `itinerary` are jsonb rather than side tables: they are always
 * read and written as a whole tour, never queried across tours, and keeping
 * them inline means saving a tour is a single row write.
 */
export const tours = pgTable(
  'tours',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** URL segment — /tours/[slug]. Derived from the title, unique site-wide. */
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    /** Plain text — the card blurb and the meta description. */
    shortDescription: text('short_description').notNull(),
    /** Sanitised TipTap HTML, rendered on the tour detail page. */
    description: text('description').notNull(),
    /** Banner / hero image URL (Vercel Blob). */
    image: text('image').notNull(),
    gallery: text('gallery')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    duration: text('duration').notNull(),
    /** Shows on the landing page's featured strip. */
    featured: boolean('featured').notNull().default(false),
    /** Unpublished tours stay editable but disappear from the public site. */
    isPublished: boolean('is_published').notNull().default(true),
    /** Ascending; ties fall back to title. */
    sortOrder: integer('sort_order').notNull().default(0),
    /** { sedan: { price, capacity }, suv: {...}, van: {...} } */
    pricing: jsonb('pricing').$type<TourPricingOptions>().notNull(),
    /** Ordered stops: [{ time?, activity }] */
    itinerary: jsonb('itinerary').$type<ItineraryItem[]>().notNull(),
    inclusions: text('inclusions')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    exclusions: text('exclusions')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    createdBy: uuid('created_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    updatedBy: uuid('updated_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('tours_slug_uidx').on(table.slug),
    index('tours_published_idx').on(table.isPublished, table.sortOrder),
  ]
);

// --- Fleet (the landing page's vehicle line-up, editable from the portal) ---

/**
 * One row per vehicle class the fleet section advertises — a Sedan, an SUV, a
 * Van — not one row per physical car. That is the level the public page has
 * always sold at ("Sedan · Vios / Mirage G4 (AT) · ₱1,500 / 24 hours"), and it
 * is what an editor maintains.
 *
 * `features` is a text[] rather than jsonb: it is a flat list of short lines,
 * exactly like the tours' inclusions, and Postgres arrays keep it that way.
 */
export const vehicles = pgTable(
  'vehicles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** The class name shown as the card heading — "Sedan", "SUV", "Van". */
    type: text('type').notNull(),
    /** The actual cars in that class — "Vios / Mirage G4 (AT)". */
    models: text('models').notNull(),
    /** Free text so "5-seater" and "15-seater" read the way they always have. */
    capacity: text('capacity').notNull(),
    /** Whole pesos for 24 hours — the card's headline price. */
    rate: integer('rate').notNull(),
    features: text('features')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    /** Card image URL (Vercel Blob). */
    image: text('image').notNull(),
    /** Draws the "MOST POPULAR" ribbon and the coral treatment on the card. */
    popular: boolean('popular').notNull().default(false),
    /** Unpublished vehicles stay editable but disappear from the public site. */
    isPublished: boolean('is_published').notNull().default(true),
    /** Ascending; ties fall back to the type name. */
    sortOrder: integer('sort_order').notNull().default(0),
    createdBy: uuid('created_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    updatedBy: uuid('updated_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('vehicles_published_idx').on(table.isPublished, table.sortOrder)]
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
export type Quote = typeof quotes.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Referral = typeof referrals.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type TourRow = typeof tours.$inferSelect;
export type NewTourRow = typeof tours.$inferInsert;
export type VehicleRow = typeof vehicles.$inferSelect;
export type NewVehicleRow = typeof vehicles.$inferInsert;
