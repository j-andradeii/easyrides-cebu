/**
 * /api/admin/vehicles — the portal's view of the public fleet.
 *
 *   GET   list every vehicle, published or not
 *   POST  create one
 */

import type { NextRequest } from 'next/server';

import { AdminRouteError, handleAdminRoute } from '@/lib/auth/require-admin';
import { createVehicle, listVehicles } from '@/lib/vehicles/repository';
import { revalidateFleetPages } from '@/lib/vehicles/revalidate';
import { vehicleInputSchema } from '@/models/vehicle.schema';
import type { VehicleListItem, VehicleRecord } from '@/types/vehicle';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return handleAdminRoute(async (): Promise<{ items: VehicleListItem[] }> => {
    return { items: await listVehicles() };
  });
}

export async function POST(request: NextRequest) {
  return handleAdminRoute(async (admin): Promise<{ vehicle: VehicleRecord }> => {
    const parsed = vehicleInputSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      throw new AdminRouteError(
        parsed.error.issues[0]?.message ?? 'Please check the vehicle details',
        400
      );
    }

    const vehicle = await createVehicle(parsed.data, admin.id);

    revalidateFleetPages(vehicle.slug);

    return { vehicle };
  });
}
