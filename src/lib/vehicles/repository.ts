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
import { and, asc, eq, ne, sql, type SQL } from 'drizzle-orm';

import { db } from '@/db/client';
import { adminUsers, vehicles, type NewVehicleRow, type VehicleRow } from '@/db/schema';
import { uniqueSlug } from '@/lib/slug';
import type { VehicleInput, VehiclePatch } from '@/models/vehicle.schema';
import type { Vehicle, VehicleListItem, VehicleRecord } from '@/types/vehicle';

// --- Row → API shapes -------------------------------------------------------

function toVehicle(row: VehicleRow): Vehicle {
  return {
    slug: row.slug,
    type: row.type,
    models: row.models,
    capacity: row.capacity,
    rate: row.rate,
    features: row.features,
    image: row.image,
    gallery: row.gallery,
    popular: row.popular,
  };
}

function toVehicleRecord(row: VehicleRow, updatedByName: string | null): VehicleRecord {
  return {
    ...toVehicle(row),
    gallery: row.gallery,
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
    slug: row.slug,
    type: row.type,
    models: row.models,
    capacity: row.capacity,
    rate: row.rate,
    image: row.image,
    popular: row.popular,
    isPublished: row.isPublished,
    sortOrder: row.sortOrder,
    featureCount: row.features.length,
    galleryCount: row.gallery.length,
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

/**
 * One vehicle's public page, /fleet/[slug].
 *
 * Deliberately does NOT swallow errors, matching `getPublishedTourBySlug`: a
 * 500 is more honest than a 404 on a vehicle that exists.
 */
export const getPublishedVehicleBySlug = cache(async (slug: string): Promise<Vehicle | null> => {
  const [row] = await db
    .select()
    .from(vehicles)
    .where(and(eq(vehicles.slug, slug), eq(vehicles.isPublished, true)))
    .limit(1);

  return row ? toVehicle(row) : null;
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

/** True when another vehicle already owns this slug. */
export async function isSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  const filters: SQL[] = [eq(vehicles.slug, slug)];
  if (excludeId) filters.push(ne(vehicles.id, excludeId));

  const [row] = await db
    .select({ id: vehicles.id })
    .from(vehicles)
    .where(and(...filters))
    .limit(1);

  return Boolean(row);
}

/**
 * The slug a vehicle will actually get: the admin's own if it is free,
 * otherwise the same stem with `-2`, `-3`… appended.
 *
 * The derived stem is "models then class" — "vios-mirage-g4-at-sedan" — because
 * the class alone ("sedan") collides the moment a second sedan joins the fleet,
 * and the models are what a customer recognises in the address bar.
 */
export async function resolveSlug(input: {
  slug?: string | null;
  models: string;
  type: string;
  excludeId?: string;
}): Promise<string> {
  const base = input.slug?.trim() || `${input.models} ${input.type}`;
  return uniqueSlug(base, (candidate) => isSlugTaken(candidate, input.excludeId), 'vehicle');
}

/** Postgres unique-violation — two admins saving the same new slug at once. */
function isUniqueViolation(error: unknown): boolean {
  return (error as { code?: string })?.code === '23505';
}

export async function createVehicle(input: VehicleInput, adminId: string): Promise<VehicleRecord> {
  // Resolving the slug and inserting it are two statements, so a concurrent
  // save can still win the race. Retrying re-resolves against the row that just
  // landed — the same loop `createTour` runs.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const slug = await resolveSlug({ slug: input.slug, models: input.models, type: input.type });

    try {
      const [row] = await db
        .insert(vehicles)
        .values({
          slug,
          type: input.type,
          models: input.models,
          capacity: input.capacity,
          rate: input.rate,
          features: input.features,
          image: input.image,
          gallery: input.gallery,
          popular: input.popular,
          isPublished: input.isPublished,
          sortOrder: input.sortOrder,
          createdBy: adminId,
          updatedBy: adminId,
        })
        .returning();

      return toVehicleRecord(row, null);
    } catch (error) {
      if (!isUniqueViolation(error) || attempt === 2) throw error;
    }
  }

  // The loop either returns or throws; this only satisfies the type checker.
  throw new Error('Could not find a free slug for this vehicle');
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
  if (patch.gallery !== undefined) values.gallery = patch.gallery;
  if (patch.popular !== undefined) values.popular = patch.popular;
  if (patch.isPublished !== undefined) values.isPublished = patch.isPublished;
  if (patch.sortOrder !== undefined) values.sortOrder = patch.sortOrder;

  // The slug is only touched when the caller actually sends one. Renaming a
  // vehicle must not silently move a live URL that Google and past customers
  // hold, and the table's publish/popular toggles must not either. Sending an
  // empty slug is the explicit "re-derive it from the models" request.
  if (patch.slug !== undefined) {
    const [current] = await db
      .select({ slug: vehicles.slug, models: vehicles.models, type: vehicles.type })
      .from(vehicles)
      .where(eq(vehicles.id, id))
      .limit(1);

    if (!current) return null;

    const models = patch.models ?? current.models;
    const type = patch.type ?? current.type;
    const wanted = patch.slug.trim() || `${models} ${type}`;

    if (wanted !== current.slug) {
      values.slug = await resolveSlug({ slug: wanted, models, type, excludeId: id });
    }
  }

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
