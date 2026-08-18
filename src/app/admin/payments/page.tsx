/**
 * /admin/payments — every payment a customer has claimed, newest first.
 *
 * This is a work queue, not a ledger: a row lands here the moment someone taps
 * "Confirm my booking", carrying whatever evidence they gave. The job on this
 * screen is to spot what still needs checking, then open it.
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { LeadReference } from '@/components/admin/LeadReference';
import { formatDateTime, formatPeso } from '@/lib/format';
import * as paymentService from '@/services/payment.service';
import type { PaymentRecord, PaymentStatus } from '@/models/payment.schema';

const STATUS_TONES: Record<PaymentStatus, string> = {
  submitted: 'bg-amber-100 text-amber-800',
  verified: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<PaymentStatus, string> = {
  submitted: 'Needs checking',
  verified: 'Verified',
  rejected: 'Rejected',
};

const FILTERS: { key: PaymentStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'submitted', label: 'Needs checking' },
  { key: 'verified', label: 'Verified' },
  { key: 'rejected', label: 'Rejected' },
];

export default function AdminPaymentsPage() {
  const [items, setItems] = useState<PaymentRecord[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [filter, setFilter] = useState<PaymentStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await paymentService.listPayments(
        filter === 'all' ? {} : { status: filter }
      );
      setItems(response.items);
      setPendingCount(response.pendingCount);
      setError(null);
    } catch {
      setError('Could not load payments.');
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const claimedTotal = useMemo(
    () => items.reduce((sum, payment) => sum + Number.parseFloat(payment.amount), 0),
    [items]
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-600">
        <i className="pi pi-spin pi-spinner mr-2 text-xl" /> Loading payments…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
        <p className="mt-1 text-sm text-slate-600">
          {items.length} payment{items.length === 1 ? '' : 's'} · {formatPeso(claimedTotal)} claimed
          {pendingCount > 0 && (
            <>
              {' · '}
              <span className="font-medium text-amber-700">{pendingCount} awaiting a check</span>
            </>
          )}
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setFilter(option.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === option.key
                ? 'bg-coral text-white'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center">
          <i className="pi pi-wallet mb-3 text-3xl text-slate-400" />
          <p className="text-sm text-slate-600">
            {filter === 'all'
              ? 'No payments yet. One lands here every time a customer confirms a quote.'
              : `No ${STATUS_LABELS[filter as PaymentStatus].toLowerCase()} payments.`}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((payment) => (
            <li key={payment.id}>
              <Link
                href={`/admin/payments/${payment.id}`}
                className="block rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-coral/50 hover:bg-coral/[0.02]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-bold text-slate-900">
                        {formatPeso(payment.amount)}
                      </span>
                      <span className="text-sm text-slate-600">via {payment.methodLabel}</span>
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          STATUS_TONES[payment.status]
                        }`}
                      >
                        {STATUS_LABELS[payment.status]}
                      </span>
                      {/* The bold figure on the left is what to look for in the
                          bank app. On a downpayment that is deliberately less
                          than the booking, so the row has to say so — verifying
                          it does not mean the trip is paid for. */}
                      {payment.isDownpayment ? (
                        <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                          Downpayment of {formatPeso(payment.quoteTotal)}
                        </span>
                      ) : (
                        payment.quoteType === 'partial_payment' && (
                          <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                            {payment.quoteTypeLabel}
                          </span>
                        )
                      )}
                      {/* "No screenshot" is a warning about a transfer nobody
                          can match — on a cash booking it is just how cash
                          works, so it would cry wolf on every row. */}
                      {payment.paidOnPickup ? (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                          <i className="pi pi-money-bill text-[10px]" /> Cash on pickup
                        </span>
                      ) : payment.hasProof ? (
                        <span className="inline-flex items-center gap-1 rounded bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">
                          <i className="pi pi-image text-[10px]" /> Screenshot
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          No screenshot
                        </span>
                      )}
                    </div>

                    <p className="mt-1.5 truncate text-sm font-medium text-slate-800">
                      {payment.customerName ?? 'Unnamed customer'}
                      <span className="font-normal text-slate-600">
                        {' · '}
                        {payment.opportunityTitle}
                      </span>
                    </p>

                    {/* Three different references meet on a payment row — the
                        lead, the quote being settled, and the customer's own
                        receipt number. Unlabelled they are just three mono
                        strings, so each says what it identifies. */}
                    <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-slate-600">
                      <LeadReference reference={payment.leadReference} />
                      <span>
                        quote <span className="font-mono">{payment.quoteReference}</span>
                      </span>
                      {payment.reference && (
                        <span>
                          · receipt <span className="font-mono">{payment.reference}</span>
                        </span>
                      )}
                      <span>· {formatDateTime(payment.createdAt)}</span>
                    </p>
                  </div>

                  <span className="shrink-0 self-center text-slate-400">
                    <i className="pi pi-chevron-right" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
