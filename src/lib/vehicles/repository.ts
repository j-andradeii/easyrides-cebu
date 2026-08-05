/**
 * The fleet — SERVER ONLY.
 *
 * One module owns every read and write of the `vehicles` table: the landing
 * page reads through it, and /admin/vehicles writes through it. Nothing else
 * builds a vehicle query, so the "published only, in display order" rule lives
 * in one place — the same arrangement as `lib/tours/repository`.
 *
 * Two flavours of public reader, matching `lib/tours/repository`:
 * `listPublishedVehicles` throws so `/api/vehicles` can tell "no fleet" apart
 * from "Postgres is down", and `getPublishedVehicles` swallows the error so a
 * blip empties the fleet section rather than taking the whole landing page down.
 */

import 'server-only';

import { cache } from 'react';
import { asc, eq, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { adminUsers, vehicles, type NewVehicleRow, type VehicleRow } from '@/db/schema';
import type { VehicleInput, VehiclePatch } from '@/models/vehicle.schema';
import type { Vehicle, VehicleListItem, VehicleRecord } from '@/types/vehicle';

// --- Row → API shapes -------------------------------------------------------

function toVehicle(row: VehicleRow): Vehicle {
  return {
    type: row.type,
    models: row.models,
    capacity: row.capacity,
    rate: row.rate,
    features: row.features,
    image: row.image,
    popular: row.popular,
  };
}

function toVehicleRecord(row: VehicleRow, updatedByName: string | null): VehicleRecord {
  return {
    ...toVehicle(row),
    id: row.id,
    isPublished: row.isPublished,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    updatedByName,
  };
}

function toListItem(row: VehicleRow): VehicleListItem {
  return {
    id: row.id,
    type: row.type,
    models: row.models,
    capacity: row.capacity,
    rate: row.rate,
    image: row.image,
    popular: row.popular,
    isPublished: row.isPublished,
    sortOrder: row.sortOrder,
    featureCount: row.features.length,
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Display order: the portal's sortOrder first, then alphabetical. */
const DISPLAY_ORDER = [asc(vehicles.sortOrder), asc(vehicles.type)];

// --- Public site ------------------------------------------------------------

/**
 * The published fleet, and it THROWS if the database is unreachable —
 * `/api/vehicles` reads through this one. `cache` dedupes it for one render,
 * matching the tour readers.
 */
export const listPublishedVehicles = cache(async (): Promise<Vehicle[]> => {
  const rows = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.isPublished, true))
    .orderBy(...DISPLAY_ORDER);

  return rows.map(toVehicle);
});

/** The landing page's fleet grid. Never throws — see the note at the top. */
export const getPublishedVehicles = cache(async (): Promise<Vehicle[]> => {
  try {
    return await listPublishedVehicles();
  } catch (error) {
    console.error('[vehicles] could not load the fleet:', error);
    return [];
  }
});

// --- Admin portal -----------------------------------------------------------

export async function listVehicles(): Promise<VehicleListItem[]> {
  const rows = await db.select().from(vehicles).orderBy(...DISPLAY_ORDER);
  return rows.map(toListItem);
}

export async function getVehicleById(id: string): Promise<VehicleRecord | null> {
  const [row] = await db
    .select({ vehicle: vehicles, updatedByName: adminUsers.name })
    .from(vehicles)
    .leftJoin(adminUsers, eq(adminUsers.id, vehicles.updatedBy))
    .where(eq(vehicles.id, id))
    .limit(1);

  return row ? toVehicleRecord(row.vehicle, row.updatedByName) : null;
}

export async function createVehicle(input: VehicleInput, adminId: string): Promise<VehicleRecord> {
  const [row] = await db
    .insert(vehicles)
    .values({
      type: input.type,
      models: input.models,
      capacity: input.capacity,
      rate: input.rate,
      features: input.features,
      image: input.image,
      popular: input.popular,
      isPublished: input.isPublished,
      sortOrder: input.sortOrder,
      createdBy: adminId,
      updatedBy: adminId,
    })
    .returning();

  return toVehicleRecord(row, null);
}

export async function updateVehicle(
  id: string,
  patch: VehiclePatch,
  adminId: string
): Promise<VehicleRecord | null> {
  const values: Partial<NewVehicleRow> = { updatedBy: adminId, updatedAt: new Date() };

  if (patch.type !== undefined) values.type = patch.type;
  if (patch.models !== undefined) values.models = patch.models;
  if (patch.capacity !== undefined) values.capacity = patch.capacity;
  if (patch.rate !== undefined) values.rate = patch.rate;
  if (patch.features !== undefined) values.features = patch.features;
  if (patch.image !== undefined) values.image = patch.image;
  if (patch.popular !== undefined) values.popular = patch.popular;
  if (patch.isPublished !== undefined) values.isPublished = patch.isPublished;
  if (patch.sortOrder !== undefined) values.sortOrder = patch.sortOrder;

  const [row] = await db.update(vehicles).set(values).where(eq(vehicles.id, id)).returning();
  if (!row) return null;

  return toVehicleRecord(row, null);
}

export async function deleteVehicle(id: string): Promise<boolean> {
  const [row] = await db.delete(vehicles).where(eq(vehicles.id, id)).returning({ id: vehicles.id });
  return Boolean(row);
}

/** How many vehicles exist at all — the empty-state check for the portal. */
export async function countVehicles(): Promise<number> {
  const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(vehicles);
  return row?.count ?? 0;
}
