/**
 * Admin portal data access (plan §11).
 *
 * Thin wrappers over the /api/admin/** routes so pages stay declarative.
 */

import { apiClient } from '@/services/api-client';
import type {
  InquiryDetailResponse,
  InquiryListResponse,
  MetricsResponse,
  ReferralRecord,
  ReviewRecord,
} from '@/models/crm.types';

export interface InquiryListFilters {
  query?: string;
  source?: string;
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

export const getInquiryDetail = async (id: string): Promise<InquiryDetailResponse> => {
  const response = await apiClient.get(`/api/admin/inquiries/${id}`);
  return (await response.json()) as InquiryDetailResponse;
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
