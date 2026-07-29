/**
 * GET /api/admin/payments — the "did this money arrive?" queue.
 *
 * Every quote a customer confirms files a payment here, screenshot and all.
 * Filter by status to work the queue; the default listing is newest first so
 * this morning's bookings are on top.
 */

import { handleAdminRoute } from '@/lib/auth/require-admin';
import { countPendingPayments, listPayments } from '@/lib/crm/payments';
import { PAYMENT_STATUSES, type PaymentStatus } from '@/models/payment.schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requested = url.searchParams.get('status');
  const status = PAYMENT_STATUSES.includes(requested as PaymentStatus)
    ? (requested as PaymentStatus)
    : undefined;

  return handleAdminRoute(async () => ({
    items: await listPayments({
      status,
      opportunityId: url.searchParams.get('opportunityId') ?? undefined,
    }),
    pendingCount: await countPendingPayments(),
  }));
}
