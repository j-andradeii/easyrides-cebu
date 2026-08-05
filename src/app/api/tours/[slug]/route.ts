/**
 * /api/tours/[slug] — one published tour, public and unauthenticated.
 *
 *   GET /api/tours/oslob-simala
 *
 * 404 means the slug is not a published tour; 500 means the database could not
 * be reached. `getPublishedTourBySlug` throws rather than swallowing, which is
 * what keeps those two apart.
 */

import { NextResponse } from 'next/server';

import { getPublishedTourBySlug } from '@/lib/tours/repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    const tour = await getPublishedTourBySlug(slug);

    if (!tour) {
      return NextResponse.json({ message: 'No published tour with that slug' }, { status: 404 });
    }

    return NextResponse.json({ tour });
  } catch (error) {
    console.error(`[api/tours] could not load "${slug}":`, error);
    return NextResponse.json({ message: 'Could not load that tour' }, { status: 500 });
  }
}
