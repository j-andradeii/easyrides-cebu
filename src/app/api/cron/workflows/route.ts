/**
 * POST /api/cron/workflows — the automation runner (plan §12).
 *
 * Vercel Cron pings this every 5 minutes. It picks up every enrollment whose
 * `next_run_at` has come due and advances it: the "Wait 24 hours" parts of
 * W2/W3/W4 resume here.
 *
 * Authenticated with CRON_SECRET, which Vercel sends as a Bearer token — the
 * endpoint must not be triggerable by the public.
 */

import { NextResponse } from 'next/server';

import { processDueEnrollments } from '@/lib/workflows/engine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
/** Give the runner room to work through a backlog. */
export const maxDuration = 60;

const MAX_ENROLLMENTS_PER_RUN = 100;

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;

  // Refuse to run unauthenticated rather than defaulting open.
  if (!secret) {
    console.error('[cron] CRON_SECRET is not set — refusing to run.');
    return false;
  }

  const header = request.headers.get('authorization');
  return header === `Bearer ${secret}`;
}

async function run(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const startedAt = Date.now();

  try {
    const results = await processDueEnrollments(MAX_ENROLLMENTS_PER_RUN);

    const summary = results.reduce<Record<string, number>>((acc, result) => {
      acc[result.status] = (acc[result.status] ?? 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      processed: results.length,
      steps: results.reduce((total, result) => total + result.stepsExecuted, 0),
      summary,
      durationMs: Date.now() - startedAt,
    });
  } catch (error) {
    console.error('[cron] workflow run failed:', error);
    return NextResponse.json({ message: 'Workflow run failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return run(request);
}

/** Vercel Cron issues GET requests; keep both verbs working. */
export async function GET(request: Request) {
  return run(request);
}
