/**
 * /api/admin/vehicles/[id] — read, edit and remove one vehicle.
 *
 * PATCH takes a partial body on purpose: the edit form sends the whole vehicle,
 * while the table's publish / popular switches send a single field.
 */

import type { NextRequest } from 'next/server';

import { AdminRouteError, handleAdminRoute } from '@/lib/auth/require-admin';
import { deleteVehicle, getVehicleById, updateVehicle } from '@/lib/vehicles/repository';
import { onlySentKeys } from '@/lib/patch-body';
import { revalidateFleetPages } from '@/lib/vehicles/revalidate';
import { vehiclePatchSchema } from '@/models/vehicle.schema';
import type { VehicleRecord } from '@/types/vehicle';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  return handleAdminRoute(async (): Promise<{ vehicle: VehicleRecord }> => {
    const vehicle = await getVehicleById(id);
    if (!vehicle) throw new AdminRouteError('Vehicle not found', 404);

    return { vehicle };
  });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  return handleAdminRoute(async (admin): Promise<{ vehicle: VehicleRecord }> => {
    const body = await request.json().catch(() => null);
    const parsed = vehiclePatchSchema.safeParse(body);
    if (!parsed.success) {
      throw new AdminRouteError(
        parsed.error.issues[0]?.message ?? 'Please check the vehicle details',
        400
      );
    }

    const existing = await getVehicleById(id);
    if (!existing) throw new AdminRouteError('Vehicle not found', 404);

    // The table's publish / popular switches send a single field. Without this
    // filter the schema's defaults ride along and blank the feature list, the
    // gallery and the sort order — see `onlySentKeys`.
    const vehicle = await updateVehicle(id, onlySentKeys(body, parsed.data), admin.id);
    if (!vehicle) throw new AdminRouteError('Vehicle not found', 404);

    // The old slug too: a rename leaves a cached page at the previous URL.
    revalidateFleetPages(existing.slug, vehicle.slug);

    return { vehicle };
  });
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  // Removing a vehicle takes a card off the landing page, so it is owner/admin
  // work — an agent can unpublish instead, which is reversible.
  return handleAdminRoute(
    async (): Promise<{ success: true }> => {
      const existing = await getVehicleById(id);
      if (!existing) throw new AdminRouteError('Vehicle not found', 404);

      const removed = await deleteVehicle(id);
      if (!removed) throw new AdminRouteError('Vehicle not found', 404);

      revalidateFleetPages(existing.slug);

      return { success: true as const };
    },
    { roles: ['owner', 'admin'] }
  );
}
