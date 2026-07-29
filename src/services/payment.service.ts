/**
 * Payments data access for the admin portal.
 *
 * Kept separate from `inquiry.service` because payments are their own screen
 * with their own queue — the lead detail page just links across to it.
 */

import { apiClient } from '@/services/api-client';
import type {
  PaymentDetail,
  PaymentRecord,
  PaymentStatus,
  ReviewPaymentInput,
} from '@/models/payment.schema';

export interface PaymentListResponse {
  items: PaymentRecord[];
  /** Payments nobody has checked yet — the number the queue is really about. */
  pendingCount: number;
}

export const listPayments = async (
  filters: { status?: PaymentStatus; opportunityId?: string } = {}
): Promise<PaymentListResponse> => {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.opportunityId) params.set('opportunityId', filters.opportunityId);

  const query = params.toString();
  const response = await apiClient.get(`/api/admin/payments${query ? `?${query}` : ''}`);
  return (await response.json()) as PaymentListResponse;
};

export const getPayment = async (paymentId: string): Promise<PaymentDetail> => {
  const response = await apiClient.get(`/api/admin/payments/${paymentId}`);
  return (await response.json()) as PaymentDetail;
};

export const reviewPayment = async (
  paymentId: string,
  input: ReviewPaymentInput
): Promise<{ success: true; status: PaymentStatus }> => {
  const response = await apiClient.patch(`/api/admin/payments/${paymentId}`, input);
  return (await response.json()) as { success: true; status: PaymentStatus };
};
