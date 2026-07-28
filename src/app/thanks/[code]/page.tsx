/**
 * /thanks/[code] — the referrer's share hub (plan §7A.5).
 *
 * Rule 3 of §7A.3: make it one tap. The WhatsApp and Messenger buttons carry a
 * pre-written message containing their unique link, so there is zero typing.
 *
 * Keyed by the referral code rather than a separate token: the code is what the
 * customer hands out anyway, and this page only ever shows their own counts.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface ShareContext {
  code: string;
  name: string;
  shareUrl: string;
  refereeReward: string;
  referrerReward: string;
  stats: {
    invitesClicked: number;
    booked: number;
    rewarded: number;
    pendingApproval: number;
  };
}

export default function ShareHubPage() {
  const params = useParams<{ code: string }>();
  const code = params?.code;

  const [context, setContext] = useState<ShareContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!code) return;

    fetch(`/api/referrals/share?code=${encodeURIComponent(code)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error('invalid');
        return (await response.json()) as ShareContext;
      })
      .then(setContext)
      .catch(() => setContext(null))
      .finally(() => setIsLoading(false));
  }, [code]);

  const logShare = useCallback(
    (channel: 'whatsapp' | 'messenger' | 'copy') => {
      if (!code) return;
      void fetch('/api/referrals/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, channel }),
      });
    },
    [code]
  );

  const copyLink = async () => {
    if (!context) return;
    try {
      await navigator.clipboard.writeText(context.shareUrl);
      setCopied(true);
      logShare('copy');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard can be blocked; the link is visible on screen either way.
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream">
        <p className="text-slate-500">
          <i className="pi pi-spin pi-spinner mr-2" /> Loading your link…
        </p>
      </main>
    );
  }

  if (!context) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream px-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">
          <h1 className="text-2xl font-bold text-slate-900">We couldn&apos;t find that link</h1>
          <p className="mt-2 text-slate-600">
            Message us on WhatsApp and we&apos;ll send you a fresh one.
          </p>
        </div>
      </main>
    );
  }

  const shareText = `I used EasyRideCebu for getting around Cebu and they were great. Use my link and you'll get ${context.refereeReward}: ${context.shareUrl}`;

  return (
    <main className="min-h-screen bg-cream px-4 py-10">
      <div className="mx-auto max-w-md space-y-6">
        <div className="rounded-3xl bg-gradient-to-br from-coral to-mango p-6 text-white shadow-xl sm:p-8">
          <h1 className="text-2xl font-bold">Thanks, {context.name}! 🎉</h1>
          <p className="mt-2 text-white/90">
            Share your link: your friend gets {context.refereeReward}, and you get{' '}
            {context.referrerReward}.
          </p>
        </div>

        {/* One-tap share (§7A.3 rule 3) */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Share in one tap
          </h2>

          <div className="mt-4 space-y-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => logShare('whatsapp')}
              className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3.5 font-semibold text-white transition-colors hover:bg-green-700"
            >
              <i className="pi pi-whatsapp" /> Share on WhatsApp
            </a>

            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(context.shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => logShare('messenger')}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 font-semibold text-white transition-colors hover:bg-blue-700"
            >
              <i className="pi pi-facebook" /> Share on Facebook
            </a>

            <button
              type="button"
              onClick={copyLink}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 px-5 py-3.5 font-semibold text-slate-700 transition-colors hover:border-coral hover:text-coral"
            >
              <i className={`pi ${copied ? 'pi-check' : 'pi-copy'}`} />
              {copied ? 'Link copied!' : 'Copy my link'}
            </button>
          </div>

          <p className="mt-4 break-all rounded-lg bg-slate-50 px-3 py-2 text-center font-mono text-xs text-slate-500">
            {context.shareUrl}
          </p>
        </div>

        {/* Reward status */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Your rewards
          </h2>

          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <Stat label="Clicks" value={context.stats.invitesClicked} />
            <Stat label="Booked" value={context.stats.booked} />
            <Stat label="Rewarded" value={context.stats.rewarded} />
          </div>

          {context.stats.pendingApproval > 0 && (
            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
              {context.stats.pendingApproval} reward
              {context.stats.pendingApproval === 1 ? '' : 's'} awaiting approval — we&apos;ll be in
              touch to send it.
            </p>
          )}

          <p className="mt-4 text-xs text-slate-500">
            Rewards unlock once your friend completes a paid booking.
          </p>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-slate-50 px-2 py-3">
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
