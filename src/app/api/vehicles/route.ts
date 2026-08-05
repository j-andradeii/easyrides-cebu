/**
 * /api/vehicles — the public fleet. No authentication: this is the same data
 * the landing page's fleet grid renders, served as JSON.
 *
 *   GET /api/vehicles
 *
 * Dynamic for the same reason as /api/tours: it reads Postgres on every
 * request, so it answers "is the live site seeing the fleet?" directly.
 */

import { NextResponse } from 'next/server';

import { listPublishedVehicles } from '@/lib/vehicles/repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const vehicles = await listPublishedVehicles();
    return NextResponse.json({ count: vehicles.length, vehicles });
  } catch (error) {
    // A 500 rather than an empty list — see the note in /api/tours.
    console.error('[api/vehicles] could not load the fleet:', error);
    return NextResponse.json({ message: 'Could not load the fleet' }, { status: 500 });
  }
}
