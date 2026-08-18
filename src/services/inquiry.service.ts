/**
 * Admin portal data access (plan §11).
 *
 * Thin wrappers over the /api/admin/** routes so pages stay declarative.
 */

import { apiClient } from '@/services/api-client';
import type {
  CalendarResponse,
  InquiryDetailResponse,
  InquiryListResponse,
  MetricsResponse,
  ReferralRecord,
  ReviewRecord,
} from '@/models/crm.types';
import type { QuoteType } from '@/models/quote.schema';
import type { AdminLeadCreateResponse, AdminLeadData } from '@/models/inquiry.schema';

export interface InquiryListFilters {
  query?: string;
  source?: string;
  /** A campaign id — leads captured by one promo page. */
  campaign?: string;
  stage?: string;
  owner?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

function toQueryString(filters: object): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === '' || value === null) continue;
    params.set(key, String(value));
  }
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export const listInquiries = async (
  filters: InquiryListFilters = {}
): Promise<InquiryListResponse> => {
  const response = await apiClient.get(`/api/admin/inquiries${toQueryString(filters)}`);
  return (await response.json()) as InquiryListResponse;
};

export interface CalendarFilters {
  /** Inclusive 'YYYY-MM-DD' bounds — the visible grid, not a page. */
  from: string;
  to: string;
}

export const listCalendarBookings = async (
  filters: CalendarFilters
): Promise<CalendarResponse> => {
  const response = await apiClient.get(`/api/admin/calendar${toQueryString(filters)}`);
  return (await response.json()) as CalendarResponse;
};

export const getInquiryDetail = async (id: string): Promise<InquiryDetailResponse> => {
  const response = await apiClient.get(`/api/admin/inquiries/${id}`);
  return (await response.json()) as InquiryDetailResponse;
};

/**
 * Creates a lead by hand — the walk-ins and phone calls that never fill in a
 * form. Goes through the same intake as the public site, so the new lead lands
 * at New Lead with W1 already enrolled.
 */
export const createLead = async (input: AdminLeadData): Promise<AdminLeadCreateResponse> => {
  const response = await apiClient.post('/api/admin/inquiries', input);
  return (await response.json()) as AdminLeadCreateResponse;
};

export interface OpportunityPatch {
  stageKey?: string;
  ownerId?: string | null;
  status?: string;
  monetaryValue?: string;
  lostReason?: string;
  expectedCloseDate?: string | null;
  preferredDate?: string | null;
}

export const patchOpportunity = async (
  id: string,
  patch: OpportunityPatch
): Promise<{ success: true }> => {
  const response = await apiClient.patch(`/api/admin/opportunities/${id}`, patch);
  return (await response.json()) as { success: true };
};

export const addActivity = async (
  opportunityId: string,
  input: { type: string; body?: string; subject?: string; channel?: string }
): Promise<{ success: true }> => {
  const response = await apiClient.post(
    `/api/admin/opportunities/${opportunityId}/activities`,
    input
  );
  return (await response.json()) as { success: true };
};

export const createTask = async (
  opportunityId: string,
  input: { title: string; dueAt?: string | null; assignedTo?: string | null }
): Promise<{ success: true }> => {
  const response = await apiClient.post(`/api/admin/opportunities/${opportunityId}/tasks`, input);
  return (await response.json()) as { success: true };
};

export const updateTask = async (
  taskId: string,
  input: { status?: string; dueAt?: string | null; title?: string }
): Promise<{ success: true }> => {
  const response = await apiClient.patch(`/api/admin/tasks/${taskId}`, input);
  return (await response.json()) as { success: true };
};

export const enrollInWorkflow = async (
  opportunityId: string,
  workflowKey: string
): Promise<{ success: true }> => {
  const response = await apiClient.post(`/api/admin/opportunities/${opportunityId}/enroll`, {
    workflowKey,
  });
  return (await response.json()) as { success: true };
};

export const updateEnrollment = async (
  enrollmentId: string,
  action: 'pause' | 'resume' | 'exit'
): Promise<{ success: true }> => {
  const response = await apiClient.post(`/api/admin/enrollments/${enrollmentId}/pause`, { action });
  return (await response.json()) as { success: true };
};

export interface SendQuoteInput {
  lineItems: { label: string; description?: string; quantity: number; unitPrice: number }[];
  discount?: number;
  /**
   * Referral credits to spend on this quote. Ids only — the server re-reads
   * each one's value and availability, so this is a request, not an amount.
   */
  creditIds?: string[];
  /** Whether this quote settles the booking or is one instalment of it. */
  quoteType: QuoteType;
  /**
   * The downpayment due up front on a partial payment. The quote still shows
   * the full price — this is only what the customer has to send now.
   */
  depositAmount?: number;
  notes?: string;
  validForDays: number;
  /**
   * False keeps quotes already awaiting a decision live alongside this one —
   * how a booking gets split across payments. Defaults to true server-side.
   */
  supersedeOpen?: boolean;
}

export interface SendQuoteResult {
  success: true;
  url: string;
  token: string;
  /** Whether the quote email actually left for the contact. */
  emailed: boolean;
  emailedTo: string | null;
  emailError: string | null;
  /**
   * Referral credit actually reserved, in pesos. Can be less than what was
   * asked for — a credit spent on another quote in the meantime is skipped
   * rather than double-counted — so this is what the toast should report.
   */
  creditApplied: number;
}

export const sendQuote = async (
  opportunityId: string,
  input: SendQuoteInput
): Promise<SendQuoteResult> => {
  const response = await apiClient.post(
    `/api/admin/opportunities/${opportunityId}/quotes`,
    input
  );
  return (await response.json()) as SendQuoteResult;
};

export const getMetrics = async (): Promise<MetricsResponse> => {
  const response = await apiClient.get('/api/admin/metrics');
  return (await response.json()) as MetricsResponse;
};

export const listReviews = async (
  filters: { published?: string } = {}
): Promise<{ items: ReviewRecord[] }> => {
  const response = await apiClient.get(`/api/admin/reviews${toQueryString(filters)}`);
  return (await response.json()) as { items: ReviewRecord[] };
};

export const moderateReview = async (
  reviewId: string,
  input: { isPublished: boolean }
): Promise<{ success: true }> => {
  const response = await apiClient.patch(`/api/admin/reviews/${reviewId}`, input);
  return (await response.json()) as { success: true };
};

export const listReferrals = async (): Promise<{
  items: ReferralRecord[];
  leaderboard: { contactId: string; name: string | null; referrals: number; booked: number }[];
}> => {
  const response = await apiClient.get('/api/admin/referrals');
  return (await response.json()) as {
    items: ReferralRecord[];
    leaderboard: { contactId: string; name: string | null; referrals: number; booked: number }[];
  };
};

export const updateReferral = async (
  referralId: string,
  action: 'approve' | 'void'
): Promise<{ success: true }> => {
  const response = await apiClient.patch(`/api/admin/referrals/${referralId}`, { action });
  return (await response.json()) as { success: true };
};
