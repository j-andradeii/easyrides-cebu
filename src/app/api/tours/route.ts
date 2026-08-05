/**
 * /api/tours — the public tour catalogue. No authentication: this is the same
 * data every visitor already sees on /tours, served as JSON.
 *
 *   GET /api/tours              every published tour, in display order
 *   GET /api/tours?featured=1   the featured strip only
 *   GET /api/tours?limit=3      cap the number returned
 *
 * `force-dynamic` is the point of the route: it reads Postgres on every request,
 * so hitting it is a direct answer to "is the live site actually seeing the
 * catalogue?" — no build output, no ISR cache in between.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { listFeaturedTours, listPublishedTours } from '@/lib/tours/repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** `?limit=` if it is a sane positive number, otherwise nothing. */
function parseLimit(raw: string | null): number | undefined {
  if (!raw) return undefined;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value > 0 ? Math.min(value, 100) : undefined;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const featured = params.get('featured') === '1' || params.get('featured') === 'true';
  const limit = parseLimit(params.get('limit'));

  try {
    // The featured reader takes the limit itself; the full catalogue is sliced
    // after the query, which keeps one ORDER BY in the repository.
    const tours = featured
      ? await listFeaturedTours(limit ?? 3)
      : (await listPublishedTours()).slice(0, limit);

    return NextResponse.json({ count: tours.length, tours });
  } catch (error) {
    // Deliberately a 500, not an empty list: an empty catalogue and an
    // unreachable database must not look the same from the outside.
    console.error('[api/tours] could not load the catalogue:', error);
    return NextResponse.json({ message: 'Could not load the tour catalogue' }, { status: 500 });
  }
}
