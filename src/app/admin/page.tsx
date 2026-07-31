/**
 * /admin — the funnel dashboard (plan §16).
 *
 * The whole point of a funnel is measurement: where leads come from, where they
 * stall, and what that costs.
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { formatDuration, formatPercent, formatPeso, formatRelative } from '@/lib/format';
import { sourceLabel } from '@/lib/crm/normalize';
import * as inquiryService from '@/services/inquiry.service';
import type { MetricsResponse } from '@/models/crm.types';

const STAGE_LABELS: Record<string, string> = {
  new_lead: 'New Lead',
  quote_sent: 'Quote Sent',
  booked: 'Booked',
  lost: 'Lost',
};

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    inquiryService
      .getMetrics()
      .then(setMetrics)
      .catch(() => setError('Could not load the dashboard.'))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-600">
        <i className="pi pi-spin pi-spinner mr-2 text-xl" /> Loading dashboard…
      </div>
    );
  }

  if (!metrics) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {error ?? 'No data yet.'}
      </p>
    );
  }

  const maxStageCount = Math.max(1, ...metrics.stageCounts.map((stage) => stage.totalCount));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Where your leads are, and where the money is being won or lost.
        </p>
      </header>

      {/* Headline numbers */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total leads"
          value={String(metrics.totals.leads)}
          hint={`${metrics.totals.open} still open`}
          icon="pi-inbox"
        />
        <StatCard
          label="Lead → Booked"
          value={formatPercent(metrics.totals.leadToBookedRate, 1)}
          hint={`${metrics.totals.won} won · ${metrics.totals.lost} lost`}
          icon="pi-chart-line"
        />
        <StatCard
          label="Won this month"
          value={formatPeso(metrics.revenue.wonThisMonth)}
          hint={`${formatPeso(metrics.revenue.wonThisWeek)} this week`}
          icon="pi-wallet"
        />
        <StatCard
          label="Speed to lead"
          value={formatDuration(metrics.speedToLeadMinutes)}
          hint="Median time to first human reply"
          icon="pi-bolt"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Funnel */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-600">
            Funnel
          </h2>

          <ul className="space-y-3">
            {metrics.stageCounts.map((stage) => (
              <li key={stage.key}>
                <div className="mb-1 flex items-baseline justify-between text-sm">
                  <Link
                    href={`/admin/inquiries?stage=${stage.key}`}
                    className="font-medium text-slate-800 hover:text-coral"
                  >
                    {stage.name}
                  </Link>
                  <span className="text-slate-600">
                    {stage.totalCount}
                    {stage.openCount !== stage.totalCount && (
                      <span className="text-slate-500"> · {stage.openCount} open</span>
                    )}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${
                      stage.key === 'lost' ? 'bg-slate-300' : 'bg-gradient-to-r from-coral to-mango'
                    }`}
                    style={{ width: `${(stage.totalCount / maxStageCount) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>

          <h3 className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Stage-to-stage conversion
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {metrics.conversions.map((step) => (
              <div key={`${step.from}-${step.to}`} className="rounded-lg bg-slate-50 px-3 py-2.5">
                <p className="text-xs text-slate-600">
                  {STAGE_LABELS[step.from] ?? step.from} → {STAGE_LABELS[step.to] ?? step.to}
                </p>
                <p className="mt-0.5 text-lg font-semibold text-slate-900">
                  {formatPercent(step.rate, 0)}
                </p>
                <p className="text-xs text-slate-500">
                  {step.toCount} of {step.fromCount}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Today's tasks */}
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-600">
            Due today
          </h2>

          {metrics.tasksDueToday.length === 0 ? (
            <p className="text-sm text-slate-600">Nothing due — you&apos;re on top of it.</p>
          ) : (
            <ul className="space-y-2.5">
              {metrics.tasksDueToday.map((task) => {
                const isOverdue = task.dueAt !== null && new Date(task.dueAt) < new Date();
                return (
                  <li key={task.id} className="rounded-lg border border-slate-100 px-3 py-2">
                    <p className="text-sm text-slate-900">{task.title}</p>
                    <p className="mt-0.5 text-xs text-slate-600">
                      {task.assigneeName ?? 'Unassigned'}
                      {task.dueAt && (
                        <span className={isOverdue ? 'font-medium text-red-600' : ''}>
                          {' '}
                          · {formatRelative(task.dueAt)}
                        </span>
                      )}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}

          <h3 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Forecast
          </h3>
          <p className="text-2xl font-semibold text-slate-900">
            {formatPeso(metrics.revenue.weightedForecast)}
          </p>
          <p className="text-xs text-slate-600">
            Open deals weighted by their stage probability
          </p>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Source performance */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-600">
            Source performance
          </h2>

          {metrics.sourcePerformance.length === 0 ? (
            <p className="text-sm text-slate-600">No leads captured yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="pb-2 font-medium">Source</th>
                    <th className="pb-2 text-right font-medium">Leads</th>
                    <th className="pb-2 text-right font-medium">Booked</th>
                    <th className="pb-2 text-right font-medium">Rate</th>
                    <th className="pb-2 text-right font-medium">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.sourcePerformance.map((row) => (
                    <tr key={row.source} className="border-b border-slate-50 last:border-0">
                      <td className="py-2 text-slate-800">{sourceLabel(row.source)}</td>
                      <td className="py-2 text-right text-slate-700">{row.leads}</td>
                      <td className="py-2 text-right text-slate-700">{row.booked}</td>
                      <td className="py-2 text-right text-slate-700">
                        {formatPercent(row.conversionRate, 0)}
                      </td>
                      <td className="py-2 text-right font-medium text-slate-900">
                        {formatPeso(row.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {metrics.lossReasons.length > 0 && (
            <>
              <h3 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Why deals died
              </h3>
              <ul className="space-y-1.5">
                {metrics.lossReasons.map((reason) => (
                  <li key={reason.reason} className="flex justify-between text-sm">
                    <span className="min-w-0 flex-1 truncate pr-3 text-slate-700">
                      {reason.reason}
                    </span>
                    <span className="text-slate-900">{reason.count}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        {/* Virality */}
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-600">
            Reviews &amp; referrals
          </h2>

          <dl className="space-y-3 text-sm">
            <MetricRow
              label="Average rating"
              value={
                metrics.virality.averageRating !== null
                  ? `${metrics.virality.averageRating.toFixed(1)} ★`
                  : '—'
              }
            />
            <MetricRow
              label="NPS"
              value={metrics.virality.nps !== null ? metrics.virality.nps.toFixed(0) : '—'}
            />
            <MetricRow
              label="Review requests → left"
              value={`${metrics.virality.reviewsLeft} / ${metrics.virality.reviewRequests} (${formatPercent(
                metrics.virality.reviewConversionRate,
                0
              )})`}
            />
            <MetricRow
              label="Referral rate"
              value={formatPercent(metrics.virality.referralRate, 0)}
            />
            <MetricRow label="Referred bookings" value={String(metrics.virality.referralsBooked)} />
            <MetricRow
              label="Referral revenue"
              value={formatPeso(metrics.virality.referralRevenue)}
            />
            <MetricRow
              label="K-factor"
              value={metrics.virality.kFactor.toFixed(2)}
              hint={metrics.virality.kFactor > 1 ? 'Self-sustaining growth 🎉' : 'K > 1 = viral'}
            />
          </dl>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-600">{label}</p>
        <i className={`pi ${icon} text-slate-400`} />
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-600">{hint}</p>
    </div>
  );
}

function MetricRow({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-slate-600">{label}</dt>
      <dd className="text-right">
        <span className="font-medium text-slate-900">{value}</span>
        {hint && <span className="block text-xs text-slate-500">{hint}</span>}
      </dd>
    </div>
  );
}
