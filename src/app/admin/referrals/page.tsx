/**
 * /admin/referrals — referral tracking, payouts and the leaderboard (§7A.8).
 *
 * The leaderboard is worth watching: a hotel or host who keeps sending guests
 * is a B2B partner waiting to be formalised — the highest-ROI channel in §7A.3.
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { formatDate } from '@/lib/format';
import { rewardLabel } from '@/lib/crm/rewards';
import * as inquiryService from '@/services/inquiry.service';
import type { ReferralRecord } from '@/models/crm.types';

const STATUS_TONES: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-700',
  clicked: 'bg-sky-100 text-sky-700',
  signed_up: 'bg-violet-100 text-violet-700',
  booked: 'bg-amber-100 text-amber-800',
  rewarded: 'bg-emerald-100 text-emerald-800',
  void: 'bg-red-100 text-red-700',
};

interface Leader {
  contactId: string;
  name: string | null;
  referrals: number;
  booked: number;
}

export default function AdminReferralsPage() {
  const [items, setItems] = useState<ReferralRecord[]>([]);
  const [leaderboard, setLeaderboard] = useState<Leader[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await inquiryService.listReferrals();
      setItems(response.items);
      setLeaderboard(response.leaderboard);
      setError(null);
    } catch {
      setError('Could not load referrals.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const awaitingPayout = useMemo(
    () => items.filter((item) => item.status === 'booked').length,
    [items]
  );

  const act = async (referralId: string, action: 'approve' | 'void') => {
    setIsBusy(true);
    setError(null);
    try {
      await inquiryService.updateReferral(referralId, action);
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
        <i className="pi pi-spin pi-spinner mr-2 text-xl" /> Loading referrals…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Referrals</h1>
        <p className="mt-1 text-sm text-slate-600">
          {items.length} referral{items.length === 1 ? '' : 's'}
          {awaitingPayout > 0 && ` · ${awaitingPayout} awaiting payout approval`}
        </p>
      </header>

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-600">
            All referrals
          </h2>

          {items.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-600">
              No referrals yet. W4 invites happy customers to share after every trip.
            </p>
          ) : (
            <ul className="space-y-3">
              {items.map((referral) => (
                <li key={referral.id} className="rounded-lg border border-slate-100 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-slate-900">
                          {referral.referrerName ?? 'Unknown'}
                        </span>
                        <i className="pi pi-arrow-right text-[10px] text-slate-400" />
                        <span className="text-slate-800">
                          {referral.refereeName ?? 'not claimed yet'}
                        </span>
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${
                            STATUS_TONES[referral.status] ?? 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {referral.status.replace('_', ' ')}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-slate-600">
                        <span className="font-mono">{referral.code}</span>
                        {referral.channel && ` · via ${referral.channel}`}
                        {` · ${formatDate(referral.createdAt)}`}
                        {referral.status === 'rewarded' &&
                          ` · paid ${formatDate(referral.rewardPaidAt)}`}
                      </p>

                      {(referral.referrerReward || referral.refereeReward) && (
                        <p className="mt-1 text-xs text-slate-700">
                          Referrer: {rewardLabel(referral.referrerReward)} · Friend:{' '}
                          {rewardLabel(referral.refereeReward)}
                        </p>
                      )}

                      {referral.abuseFlag && (
                        <p className="mt-1.5 inline-flex items-center gap-1 rounded bg-red-50 px-2 py-0.5 text-xs text-red-700">
                          <i className="pi pi-flag text-[10px]" /> {referral.abuseFlag}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      {referral.refereeOpportunityId && (
                        <Link
                          href={`/admin/inquiries/${referral.refereeOpportunityId}`}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Open booking
                        </Link>
                      )}

                      {referral.status === 'booked' && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => act(referral.id, 'approve')}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-40"
                        >
                          Approve payout
                        </button>
                      )}

                      {referral.status !== 'void' && referral.status !== 'rewarded' && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => act(referral.id, 'void')}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                        >
                          Void
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-600">
            Top referrers
          </h2>
          <p className="mb-4 text-xs text-slate-600">
            Someone sending guests every month is a partner worth formalising.
          </p>

          {leaderboard.length === 0 ? (
            <p className="text-sm text-slate-600">No referrers yet.</p>
          ) : (
            <ol className="space-y-2">
              {leaderboard.map((leader, index) => (
                <li
                  key={leader.contactId}
                  className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2"
                >
                  <span className="w-5 text-sm font-semibold text-slate-500">{index + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-slate-900">
                    {leader.name ?? 'Unnamed'}
                  </span>
                  <span className="text-xs text-slate-600">
                    {leader.booked}/{leader.referrals}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
