/**
 * Wire types shared by the admin API routes and the portal UI.
 *
 * These are plain interfaces rather than Drizzle's inferred row types so client
 * components never pull the ORM into the browser bundle, and so dates are
 * already serialized to ISO strings.
 */

import type { AdminRole } from '@/lib/auth/jwt';
import type { QuoteRecord } from '@/models/quote.schema';

export interface AdminSummary {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
}

export interface StageSummary {
  id: string;
  key: string;
  name: string;
  sortOrder: number;
  probability: number;
  isWon: boolean;
  isLost: boolean;
}

// --- List (/admin/inquiries) ------------------------------------------------

export interface InquiryListItem {
  opportunityId: string;
  /** The lead's own reference, e.g. "L-001042". Not the quote's "Q-…". */
  reference: string;
  createdAt: string;
  contactId: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  serviceType: string | null;
  vehicleType: string | null;
  preferredDate: string | null;
  stageKey: string;
  stageName: string;
  status: string;
  source: string | null;
  ownerId: string | null;
  ownerName: string | null;
  monetaryValue: string;
  tourTitle: string | null;
  /** The promo page that produced this lead, when one did. */
  campaignId: string | null;
  campaignName: string | null;
  /** Open tasks still attached to this deal. */
  openTaskCount: number;
}

export interface InquiryListResponse {
  items: InquiryListItem[];
  total: number;
  page: number;
  pageSize: number;
  stages: StageSummary[];
  owners: AdminSummary[];
  sources: string[];
  /** Campaigns that have produced at least one lead — the campaign filter. */
  campaigns: { id: string; name: string }[];
}

// --- Detail (/admin/inquiries/[id]) -----------------------------------------

export interface ContactDetail {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  countryCode: string | null;
  tags: string[];
  lifetimeValue: string;
  firstSource: string | null;
  notes: string | null;
  referralCode: string | null;
  referredByContactId: string | null;
  referredByName: string | null;
  createdAt: string;
}

export interface OpportunityDetail {
  id: string;
  /** The lead's own reference, e.g. "L-001042". Not the quote's "Q-…". */
  reference: string;
  title: string;
  status: string;
  stageId: string;
  stageKey: string;
  stageName: string;
  serviceType: string | null;
  vehicleType: string | null;
  monetaryValue: string;
  currency: string;
  preferredDate: string | null;
  source: string | null;
  /** The promo page this deal came in through, when it came through one. */
  campaignId: string | null;
  campaignName: string | null;
  campaignSlug: string | null;
  lostReason: string | null;
  expectedCloseDate: string | null;
  ownerId: string | null;
  ownerName: string | null;
  wonAt: string | null;
  lostAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InquiryRecord {
  id: string;
  source: string;
  serviceType: string | null;
  vehicleType: string | null;
  preferredDate: string | null;
  addDriver: boolean;
  message: string | null;
  tourTitle: string | null;
  /** The exact car from a /fleet/[slug] inquiry, e.g. "Vios / Mirage G4 (AT)". */
  vehicleName: string | null;
  /** How many days they asked to rent for. Only the fleet form collects it. */
  rentalDays: number | null;
  /** Where they want the car handed over — free text, may be null. */
  pickupLocation: string | null;
  rawPayload: unknown;
  utm: unknown;
  createdAt: string;
}

export interface ActivityRecord {
  id: string;
  type: string;
  channel: string | null;
  subject: string | null;
  body: string | null;
  metadata: Record<string, unknown> | null;
  adminUserId: string | null;
  adminName: string | null;
  createdAt: string;
}

export interface TaskRecord {
  id: string;
  title: string;
  status: string;
  dueAt: string | null;
  completedAt: string | null;
  assignedTo: string | null;
  assigneeName: string | null;
  createdAt: string;
}

export interface EnrollmentRecord {
  id: string;
  workflowKey: string;
  workflowName: string;
  workflowDescription: string | null;
  status: string;
  currentStep: number;
  totalSteps: number;
  /** Human summary of what happens next, e.g. "Follow-up msg #2". */
  nextStepLabel: string | null;
  nextRunAt: string | null;
  enrolledAt: string;
  completedAt: string | null;
}

export interface ReviewRecord {
  id: string;
  rating: number | null;
  nps: number | null;
  comment: string | null;
  isPromoter: boolean | null;
  leftPublic: boolean;
  publicChannel: string | null;
  isPublished: boolean;
  token: string;
  contactId: string;
  contactName: string | null;
  opportunityId: string | null;
  submittedAt: string | null;
  createdAt: string;
}

export interface ReferralRecord {
  id: string;
  code: string;
  status: string;
  channel: string | null;
  referrerContactId: string;
  referrerName: string | null;
  referrerPhone: string | null;
  refereeContactId: string | null;
  refereeName: string | null;
  refereeOpportunityId: string | null;
  referrerReward: string | null;
  refereeReward: string | null;
  rewardPaidAt: string | null;
  abuseFlag: string | null;
  createdAt: string;
  convertedAt: string | null;
}

/**
 * One referral credit — pesos this contact can take off a future quote.
 *
 * `status` is the ledger's own enum: available | applied | redeemed | expired |
 * void. The quote builder only ever offers `available` rows; the rest are there
 * so an agent can answer "what happened to my ₱500?" without a database query.
 */
export interface CreditRecord {
  id: string;
  /** Decimal string, matching every other money field on the wire. */
  amount: string;
  currency: string;
  status: string;
  /** What the customer was told they were getting. */
  reason: string;
  /** The quote it is reserved against, while it is. */
  quoteId: string | null;
  expiresAt: string | null;
  redeemedAt: string | null;
  createdAt: string;
}

export interface InquiryDetailResponse {
  opportunity: OpportunityDetail;
  contact: ContactDetail;
  inquiries: InquiryRecord[];
  activities: ActivityRecord[];
  tasks: TaskRecord[];
  enrollments: EnrollmentRecord[];
  reviews: ReviewRecord[];
  referrals: ReferralRecord[];
  quotes: QuoteRecord[];
  /** This contact's whole credit ledger, newest first. */
  credits: CreditRecord[];
  stages: StageSummary[];
  owners: AdminSummary[];
}

// --- Metrics (/admin) -------------------------------------------------------

export interface StageCount {
  key: string;
  name: string;
  sortOrder: number;
  openCount: number;
  totalCount: number;
}

export interface ConversionStep {
  from: string;
  to: string;
  fromCount: number;
  toCount: number;
  rate: number;
}

export interface SourcePerformance {
  source: string;
  leads: number;
  booked: number;
  revenue: string;
  conversionRate: number;
}

export interface LossReason {
  reason: string;
  count: number;
}

export interface MetricsResponse {
  stageCounts: StageCount[];
  conversions: ConversionStep[];
  totals: {
    leads: number;
    open: number;
    won: number;
    lost: number;
    leadToBookedRate: number;
  };
  revenue: {
    wonThisWeek: string;
    wonThisMonth: string;
    wonAllTime: string;
    weightedForecast: string;
  };
  /** Median minutes from inquiry created to first human contact. */
  speedToLeadMinutes: number | null;
  sourcePerformance: SourcePerformance[];
  lossReasons: LossReason[];
  tasksDueToday: TaskRecord[];
  virality: {
    averageRating: number | null;
    nps: number | null;
    reviewsLeft: number;
    reviewRequests: number;
    reviewConversionRate: number;
    referralRate: number;
    referralsBooked: number;
    referralRevenue: string;
    kFactor: number;
  };
}
