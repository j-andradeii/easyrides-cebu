/**
 * /review/[token] — the one-tap post-trip feedback page (plan §7A.2).
 *
 * Asked ~3 hours after the trip by W4, at the peak-end moment. The token
 * pre-authenticates the customer, so leaving feedback is a single tap.
 *
 * Compliance: everyone is offered the public review links regardless of score.
 * Unhappy customers additionally get a private recovery path — we never hide
 * the public option, which would be review gating.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

const GOOGLE_REVIEW_URL =
  'https://search.google.com/local/writereview?placeid=ChIJ_____EasyRideCebu';
const FACEBOOK_REVIEW_URL = 'https://www.facebook.com/easyridecebu/reviews';

interface ReviewContext {
  name: string;
  service: string;
  tripDate: string | null;
  referralCode: string | null;
  alreadySubmitted: boolean;
  rating: number | null;
  nps: number | null;
}

export default function ReviewPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token;

  const [context, setContext] = useState<ReviewContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);

  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ isPromoter: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    fetch(`/api/reviews?token=${encodeURIComponent(token)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error('invalid');
        return (await response.json()) as ReviewContext;
      })
      .then((data) => {
        setContext(data);
        if (data.alreadySubmitted) {
          setRating(data.rating);
          setSubmitted({ isPromoter: (data.rating ?? 0) >= 4 });
        }
      })
      .catch(() => setInvalid(true))
      .finally(() => setIsLoading(false));
  }, [token]);

  const submit = useCallback(async () => {
    if (!token || rating === null) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, rating, comment: comment.trim() || undefined }),
      });

      if (!response.ok) throw new Error('failed');
      const data = (await response.json()) as { isPromoter: boolean };
      setSubmitted(data);
    } catch {
      setError('We could not save that. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [token, rating, comment]);

  /** Records the click-out so we can measure review-request → review-left. */
  const trackPublicClick = (channel: 'google' | 'facebook') => {
    if (!token) return;
    void fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, publicChannel: channel }),
    });
  };

  if (isLoading) {
    return (
      <Shell>
        <p className="text-center text-slate-500">
          <i className="pi pi-spin pi-spinner mr-2" /> Loading…
        </p>
      </Shell>
    );
  }

  if (invalid || !context) {
    return (
      <Shell>
        <h1 className="text-2xl font-bold text-slate-900">This link has expired</h1>
        <p className="mt-2 text-slate-600">
          If you&apos;d still like to share feedback, message us on WhatsApp and we&apos;ll pass it
          straight to the team.
        </p>
        <a
          href="https://wa.me/639178046988"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700"
        >
          <i className="pi pi-whatsapp" /> Message us
        </a>
      </Shell>
    );
  }

  if (submitted) {
    return (
      <Shell>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <i className="pi pi-check text-2xl text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {submitted.isPromoter ? `Thank you, ${context.name}!` : 'Thanks for being honest'}
          </h1>
          <p className="mt-2 text-slate-600">
            {submitted.isPromoter
              ? 'That means a lot to our drivers.'
              : 'We take this seriously — someone from the team will reach out personally to make it right.'}
          </p>
        </div>

        {/* Offered to everyone, not just promoters — see the header note. */}
        <div className="mt-8">
          <p className="mb-3 text-center text-sm font-medium text-slate-700">
            Would you share it publicly? It genuinely helps a small local business.
          </p>
          <div className="space-y-2">
            <a
              href={GOOGLE_REVIEW_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackPublicClick('google')}
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 transition-colors hover:border-coral hover:text-coral"
            >
              <i className="pi pi-google" /> Review us on Google
            </a>
            <a
              href={FACEBOOK_REVIEW_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackPublicClick('facebook')}
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 transition-colors hover:border-coral hover:text-coral"
            >
              <i className="pi pi-facebook" /> Review us on Facebook
            </a>
          </div>
        </div>

        {submitted.isPromoter && context.referralCode && (
          <div className="mt-8 rounded-2xl bg-gradient-to-br from-coral to-mango p-5 text-white">
            <h2 className="text-lg font-bold">Give ₱300, get ₱500</h2>
            <p className="mt-1 text-sm text-white/90">
              Share your link — your friend gets ₱300 off, you get ₱500 once they ride.
            </p>
            <a
              href={`/thanks/${context.referralCode}`}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 font-semibold text-coral"
            >
              Get my link <i className="pi pi-arrow-right text-xs" />
            </a>
          </div>
        )}
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">How was your trip, {context.name}?</h1>
        <p className="mt-2 text-slate-600">
          {context.service}
          {context.tripDate ? ` · ${context.tripDate}` : ''}
        </p>
      </div>

      <div className="mt-8">
        <p className="mb-3 text-center text-sm font-medium text-slate-700">Tap a star</p>
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              aria-label={`${star} star${star === 1 ? '' : 's'}`}
              onClick={() => setRating(star)}
              className={`text-4xl transition-transform hover:scale-110 ${
                rating !== null && star <= rating ? 'text-mango' : 'text-slate-200'
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <label htmlFor="review-comment" className="mb-2 block text-sm font-medium text-slate-700">
          Anything you&apos;d like us to know? <span className="text-slate-400">(optional)</span>
        </label>
        <textarea
          id="review-comment"
          rows={4}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          maxLength={2000}
          placeholder="Your driver, the vehicle, the route…"
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-700 focus:border-transparent focus:ring-2 focus:ring-coral"
        />
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-800">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={rating === null || isSubmitting}
        className="mt-6 w-full rounded-xl bg-gradient-to-r from-coral to-mango px-6 py-4 font-semibold text-white shadow-lg shadow-coral/25 transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
      >
        {isSubmitting ? 'Sending…' : 'Send feedback'}
      </button>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-4 py-12">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl sm:p-8">{children}</div>
    </main>
  );
}
