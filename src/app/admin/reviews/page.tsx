/**
 * /admin/reviews — the moderation queue (plan §7A.8).
 *
 * Approving a review publishes it to the landing page testimonials, so fresh
 * social proof keeps lifting new-lead conversion.
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { formatDateTime } from '@/lib/format';
import * as inquiryService from '@/services/inquiry.service';
import type { ReviewRecord } from '@/models/crm.types';

type Filter = 'all' | 'pending' | 'published';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');

  const load = useCallback(async () => {
    try {
      const response = await inquiryService.listReviews();
      setReviews(response.items);
      setError(null);
    } catch {
      setError('Could not load reviews.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    if (filter === 'pending') return reviews.filter((review) => !review.isPublished);
    if (filter === 'published') return reviews.filter((review) => review.isPublished);
    return reviews;
  }, [reviews, filter]);

  const stats = useMemo(() => {
    const rated = reviews.filter((review) => review.rating !== null);
    const average =
      rated.length > 0
        ? rated.reduce((sum, review) => sum + (review.rating ?? 0), 0) / rated.length
        : null;
    return {
      total: reviews.length,
      published: reviews.filter((review) => review.isPublished).length,
      detractors: reviews.filter((review) => review.isPromoter === false).length,
      average,
    };
  }, [reviews]);

  const toggle = async (review: ReviewRecord) => {
    setIsBusy(true);
    try {
      await inquiryService.moderateReview(review.id, { isPublished: !review.isPublished });
      await load();
    } catch {
      setError('Could not update that review.');
    } finally {
      setIsBusy(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
        <i className="pi pi-spin pi-spinner mr-2 text-xl" /> Loading reviews…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reviews</h1>
          <p className="mt-1 text-sm text-slate-500">
            {stats.total} submitted · {stats.published} published
            {stats.average !== null && ` · ${stats.average.toFixed(1)}★ average`}
          </p>
        </div>

        <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
          {(['all', 'pending', 'published'] as Filter[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={`rounded px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                filter === option ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </header>

      {stats.detractors > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <i className="pi pi-exclamation-triangle mr-2" />
          {stats.detractors} unhappy customer{stats.detractors === 1 ? '' : 's'} need
          {stats.detractors === 1 ? 's' : ''} a personal call — recover them before they post
          publicly.
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800">
          {error}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
          No reviews here yet. W4 asks every completed trip for feedback.
        </p>
      ) : (
        <ul className="space-y-3">
          {visible.map((review) => (
            <li
              key={review.id}
              className={`rounded-xl border bg-white p-4 ${
                review.isPromoter === false ? 'border-red-200' : 'border-slate-200'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-semibold text-mango">
                      {review.rating ? '★'.repeat(review.rating) : `NPS ${review.nps ?? '—'}`}
                    </span>
                    <span className="font-medium text-slate-900">
                      {review.contactName ?? 'Anonymous'}
                    </span>
                    {review.isPromoter === false && (
                      <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        needs recovery
                      </span>
                    )}
                    {review.leftPublic && (
                      <span className="rounded bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                        left on {review.publicChannel}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {formatDateTime(review.submittedAt)}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {review.opportunityId && (
                    <Link
                      href={`/admin/inquiries/${review.opportunityId}`}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Open lead
                    </Link>
                  )}
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => toggle(review)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 ${
                      review.isPublished
                        ? 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                        : 'bg-coral text-white hover:bg-coral-dark'
                    }`}
                  >
                    {review.isPublished ? 'Unpublish' : 'Publish to site'}
                  </button>
                </div>
              </div>

              {review.comment && (
                <p className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                  {review.comment}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
