/**
 * /admin/payments/[id] — one payment, everything about it.
 *
 * Three questions, in the order a person actually asks them: what did they say
 * they paid, does the screenshot back that up, and which booking is it for?
 * Verifying or rejecting from here writes the decision onto the lead's
 * timeline, so whoever picks up the phone next sees it.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

import { LeadReference } from '@/components/admin/LeadReference';
import { formatDate, formatDateTime, formatPeso } from '@/lib/format';
import * as paymentService from '@/services/payment.service';
import type { PaymentDetail, PaymentStatus } from '@/models/payment.schema';
import { QUOTE_TYPE_LABELS, type QuoteType } from '@/models/quote.schema';

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

const TYPE_TONES: Record<QuoteType, string> = {
  full_payment: 'bg-slate-100 text-slate-800',
  partial_payment: 'bg-indigo-100 text-indigo-700',
};

export default function AdminPaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProofOpen, setIsProofOpen] = useState(false);

  useEffect(() => {
    params.then(({ id }) => setPaymentId(id));
  }, [params]);

  const load = useCallback(async () => {
    if (!paymentId) return;
    try {
      setPayment(await paymentService.getPayment(paymentId));
      setError(null);
    } catch {
      setError('Could not load this payment.');
    } finally {
      setIsLoading(false);
    }
  }, [paymentId]);

  useEffect(() => {
    load();
  }, [load]);

  const review = async (action: 'verify' | 'reject') => {
    if (!paymentId) return;
    setIsBusy(true);
    setError(null);
    try {
      await paymentService.reviewPayment(paymentId, { action, note: note.trim() || undefined });
      setNote('');
      await load();
    } catch (caught) {
      setError((caught as { message?: string })?.message ?? 'That action failed.');
    } finally {
      setIsBusy(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-600">
        <i className="pi pi-spin pi-spinner mr-2 text-xl" /> Loading payment…
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="space-y-4">
        <Link href="/admin/payments" className="text-sm text-slate-600 hover:text-slate-800">
          <i className="pi pi-arrow-left mr-1.5 text-xs" /> Back to payments
        </Link>
        <p className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-600">
          {error ?? 'This payment no longer exists.'}
        </p>
      </div>
    );
  }

  const isPending = payment.status === 'submitted';

  /**
   * Verifying is the one decision on this page that moves money in the real
   * world — it is what tells the team the cash landed and the trip can be
   * assigned. Once it is made, the buttons lock.
   *
   * Rejected deliberately stays actionable: a customer who re-sends a correct
   * screenshot, or an agent who mis-clicked, needs a way forward, and rejecting
   * never released anything. So this locks on 'verified' only, not on any
   * decision having been made.
   */
  const isLocked = payment.status === 'verified';

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/payments" className="text-sm text-slate-600 hover:text-slate-800">
          <i className="pi pi-arrow-left mr-1.5 text-xs" /> Back to payments
        </Link>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">{formatPeso(payment.amount)}</h1>
          <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_TONES[payment.status]}`}>
            {STATUS_LABELS[payment.status]}
          </span>
          <span className={`rounded px-2 py-0.5 text-xs font-medium ${TYPE_TONES[payment.quoteType]}`}>
            {payment.quoteTypeLabel}
          </span>
          <span className="text-sm text-slate-600">
            via {payment.methodLabel} · {formatDateTime(payment.createdAt)}
          </span>
        </div>

        <p className="mt-1.5 text-sm text-slate-600">
          {payment.isDownpayment
            ? `Downpayment on a ${formatPeso(payment.quoteTotal)} booking${
                payment.quoteBalance ? ` — ${formatPeso(payment.quoteBalance)} still to come` : ''
              }. Verifying this secures the trip; it does not settle it.`
            : payment.quoteType === 'partial_payment'
              ? 'One instalment of this booking — the rest is billed separately.'
              : 'Settles the whole booking.'}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* The evidence */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-3">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-600">
            {payment.paidOnPickup ? 'Paying in cash' : 'Proof of payment'}
          </h2>

          {/* A cash payment has no screenshot and never will — asking for one
              would send whoever picks this up looking for evidence that does
              not exist. What they need instead is when the customer said the
              money is coming, which is all a cash booking carries. */}
          {payment.paidOnPickup ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                <i className="pi pi-money-bill text-xs" />
                The customer is paying {formatPeso(payment.amount)} in cash
              </p>
              <p className="mt-1 text-sm text-amber-900">
                Nothing was transferred, so there is no screenshot or reference to match. Verify
                this once the cash is actually in hand.
              </p>

              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-amber-800">
                When they said they&apos;ll pay
              </p>
              {payment.customerNote ? (
                <p className="mt-1 whitespace-pre-line rounded-lg bg-white/70 px-3 py-2 text-sm leading-relaxed text-amber-900">
                  {payment.customerNote}
                </p>
              ) : (
                <p className="mt-1 text-sm text-amber-900">
                  They didn&apos;t say — call them before assigning a vehicle.
                </p>
              )}
            </div>
          ) : payment.proofUrl ? (
            <>
              <button
                type="button"
                onClick={() => setIsProofOpen(true)}
                className="block w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={payment.proofUrl}
                  alt="Customer's payment screenshot"
                  className="mx-auto max-h-[28rem] w-auto object-contain"
                />
              </button>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                <span className="truncate">
                  {payment.proofFilename ?? 'screenshot'}
                  {payment.proofSize ? ` · ${(payment.proofSize / 1024).toFixed(0)} KB` : ''}
                </span>
                <a
                  href={payment.proofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-coral hover:text-coral-dark"
                >
                  <i className="pi pi-external-link mr-1 text-[10px]" />
                  Open full size
                </a>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 px-6 py-12 text-center">
              <i className="pi pi-image mb-2 text-2xl text-slate-400" />
              <p className="text-sm text-slate-600">
                The customer didn&apos;t upload a screenshot.
              </p>
              {payment.reference ? (
                <p className="mt-1 text-xs text-slate-500">
                  Match it against their reference number instead.
                </p>
              ) : (
                <p className="mt-1 text-xs text-slate-500">
                  No reference number either — call them before assigning a vehicle.
                </p>
              )}
            </div>
          )}

          <dl className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm">
            <Row
              label={payment.isDownpayment ? 'Downpayment sent' : 'Amount'}
              value={formatPeso(payment.amount)}
            />
            {payment.isDownpayment && (
              <>
                <Row label="Booking total" value={formatPeso(payment.quoteTotal)} />
                {payment.quoteBalance && (
                  <Row label="Balance to follow" value={formatPeso(payment.quoteBalance)} />
                )}
              </>
            )}
            <Row label="Payment type" value={payment.quoteTypeLabel} />
            <Row label="Method" value={payment.methodLabel} />
            {!payment.paidOnPickup && (
              <Row label="Customer reference" value={payment.reference ?? '— none given —'} mono />
            )}
            <Row label="Submitted" value={formatDateTime(payment.createdAt)} />
            {payment.reviewedAt && (
              <Row
                label={payment.status === 'verified' ? 'Verified' : 'Rejected'}
                value={`${formatDateTime(payment.reviewedAt)}${
                  payment.reviewedByName ? ` by ${payment.reviewedByName}` : ''
                }`}
              />
            )}
          </dl>

          {payment.reviewNote && (
            <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {payment.reviewNote}
            </p>
          )}
        </section>

        {/* The lead it belongs to */}
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-600">
              The booking
            </h2>

            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-slate-900">{payment.opportunityTitle}</p>
              <LeadReference reference={payment.leadReference} />
            </div>
            <p className="mt-0.5 text-sm text-slate-600">
              {payment.serviceLabel}
              {payment.vehicleLabel ? ` · ${payment.vehicleLabel}` : ''}
              {payment.tripDate ? ` · ${formatDate(payment.tripDate)}` : ''}
            </p>
            <span className="mt-2 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
              {payment.stage}
            </span>

            <dl className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
              <Row label="Lead reference" value={payment.leadReference} mono />
              <Row label="Customer" value={payment.customerName ?? '—'} />
              <Row label="Phone" value={payment.customerPhone ?? '—'} />
              <Row label="Email" value={payment.customerEmail ?? '—'} />
              <Row label="Quote" value={`${payment.quoteReference} · ${formatPeso(payment.quoteTotal)}`} />
              <Row label="Deal value" value={formatPeso(payment.dealTotal)} />
              <Row label="Verified so far" value={formatPeso(payment.verifiedTotal)} />
            </dl>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/admin/inquiries/${payment.opportunityId}`}
                className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800"
              >
                Open the lead
              </Link>
              <a
                href={payment.quoteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                View the quote
              </a>
              {payment.customerPhone && (
                <a
                  href={`tel:${payment.customerPhone}`}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <i className="pi pi-phone mr-1 text-[10px]" /> Call
                </a>
              )}
            </div>
          </section>

          {payment.dealPayments.length > 1 && (
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-600">
                All payments on this booking
              </h2>
              <p className="mb-3 text-xs text-slate-600">
                This trip is being paid in instalments.
              </p>
              <ul className="space-y-2">
                {payment.dealPayments.map((sibling) => (
                  <li key={sibling.id}>
                    <Link
                      href={`/admin/payments/${sibling.id}`}
                      className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm ${
                        sibling.id === payment.id
                          ? 'bg-coral/10 text-coral'
                          : 'bg-slate-50 text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      <span>{formatPeso(sibling.amount)}</span>
                      <span className="text-xs text-slate-600">
                        {QUOTE_TYPE_LABELS[sibling.quoteType]} · {STATUS_LABELS[sibling.status]}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-600">
              {isLocked
                ? payment.isDownpayment
                  ? 'Downpayment verified'
                  : 'Payment verified'
                : isPending
                  ? payment.paidOnPickup
                    ? 'Has the cash been handed over?'
                    : payment.isDownpayment
                      ? `Did the ${formatPeso(payment.amount)} downpayment arrive?`
                      : 'Did the money arrive?'
                  : 'Change the decision'}
            </h2>
            <p className="mb-3 text-xs text-slate-600">
              {isLocked
                ? 'This payment is confirmed and can no longer be changed here. If it was verified by mistake, open the lead and log a note so there is a record of the correction.'
                : payment.paidOnPickup
                  ? 'Only verify once someone has counted the cash. Until then this is an arrangement, not a payment.'
                  : payment.isDownpayment
                    ? // Verifying is what sends the customer their "downpayment
                      // accepted" email, so say so here — an agent who thinks
                      // this is a silent bookkeeping flip will leave the
                      // customer waiting on a mail that already went.
                      `Look for ${formatPeso(payment.amount)}, not the ${formatPeso(
                        payment.quoteTotal
                      )} booking total. Verifying emails the customer that their downpayment is accepted and their booking is secured.`
                    : 'Check your GCash or bank app against the screenshot before you verify — nothing here is proof on its own.'}
            </p>

            {isLocked ? (
              <div className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
                <i className="pi pi-check-circle mt-0.5 text-xs" />
                <span>
                  {formatPeso(payment.amount)} verified
                  {payment.reviewedAt ? ` on ${formatDateTime(payment.reviewedAt)}` : ''}
                  {payment.reviewedByName ? ` by ${payment.reviewedByName}` : ''}.
                </span>
              </div>
            ) : (
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={2}
                maxLength={500}
                placeholder="Optional note — e.g. 'Landed 2:41 PM, ref matches'"
                className="w-full rounded-lg border border-slate-800 px-3 py-2 text-sm"
              />
            )}

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={isBusy || isLocked}
                onClick={() => review('verify')}
                // aria-disabled would still be announced as actionable; a real
                // `disabled` is what stops a double-verify from a stale tab.
                title={isLocked ? 'Already verified' : undefined}
                className="flex-1 rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:hover:bg-slate-200"
              >
                <i className={`pi ${isLocked ? 'pi-check-circle' : 'pi-check'} mr-1.5 text-xs`} />
                {isLocked ? 'Verified' : 'Verify'}
              </button>
              <button
                type="button"
                disabled={isBusy || isLocked}
                onClick={() => review('reject')}
                title={isLocked ? 'Cannot reject a verified payment' : undefined}
                className="flex-1 rounded-lg border border-red-200 px-3 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-500 disabled:hover:bg-transparent"
              >
                <i className="pi pi-times mr-1.5 text-xs" />
                Reject
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Full-size proof */}
      {isProofOpen && payment.proofUrl && (
        <div
          role="dialog"
          aria-label="Payment screenshot"
          onClick={() => setIsProofOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={payment.proofUrl}
            alt="Customer's payment screenshot, full size"
            className="max-h-full max-w-full rounded-lg object-contain"
          />
          <button
            type="button"
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
          >
            <i className="pi pi-times" />
          </button>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-slate-600">{label}</dt>
      <dd className={`truncate text-right font-medium text-slate-900 ${mono ? 'font-mono' : ''}`}>
        {value}
      </dd>
    </div>
  );
}
