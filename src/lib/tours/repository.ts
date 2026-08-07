/**
 * The tour catalogue — SERVER ONLY.
 *
 * One module owns every read and write of the `tours` table: the public site
 * reads through it, and /admin/tours writes through it. Nothing else builds a
 * tour query, so the "published only, in display order" rule lives in one place.
 *
 * Two flavours of public reader, on purpose:
 *
 *   list*  throws when Postgres is unreachable. `/api/tours` uses these, because
 *          an endpoint that answers `[]` during an outage looks exactly like an
 *          empty catalogue — and the by-slug reader uses it too, where a 500 is
 *          far more honest than a 404 on a tour that exists.
 *   get*   swallows the error and returns nothing. The landing page and the
 *          catalogue use these, so a database blip empties one section instead
 *          of taking the whole marketing site down with a 500.
 */

import 'server-only';

import { cache } from 'react';
import { and, asc, eq, ne, sql, type SQL } from 'drizzle-orm';

import { db } from '@/db/client';
import { adminUsers, tours, type NewTourRow, type TourRow } from '@/db/schema';
import type { TourInput, TourPatch } from '@/models/tour.schema';
import type { Tour, TourListItem, TourRecord } from '@/types/tour';
import { uniqueSlug } from '@/lib/slug';

// --- Row → API shapes -------------------------------------------------------

function toTour(row: TourRow): Tour {
  return {
    slug: row.slug,
    title: row.title,
    shortDescription: row.shortDescription,
    description: row.description,
    image: row.image,
    gallery: row.gallery,
    duration: row.duration,
    featured: row.featured,
    pricing: row.pricing,
    itinerary: row.itinerary,
    inclusions: row.inclusions,
    exclusions: row.exclusions,
  };
}

function toTourRecord(row: TourRow, updatedByName: string | null): TourRecord {
  return {
    ...toTour(row),
    id: row.id,
    gallery: row.gallery,
    isPublished: row.isPublished,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    updatedByName,
  };
}

/** The "from ₱x" figure — the cheapest of the three vehicle rates. */
function fromPrice(row: TourRow): number {
  return Math.min(row.pricing.sedan.price, row.pricing.suv.price, row.pricing.van.price);
}

function toListItem(row: TourRow): TourListItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    image: row.image,
    duration: row.duration,
    featured: row.featured,
    isPublished: row.isPublished,
    sortOrder: row.sortOrder,
    fromPrice: fromPrice(row),
    itineraryCount: row.itinerary.length,
    galleryCount: row.gallery.length,
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Display order: the portal's sortOrder first, then alphabetical. */
const DISPLAY_ORDER = [asc(tours.sortOrder), asc(tours.title)];

// --- Public site ------------------------------------------------------------
//
// Each reader is wrapped in React's `cache`, which dedupes it for the lifetime
// of a single render. The root layout's JSON-LD and the page below it both want
// the catalogue, and without this every tour page would run the same query
// twice. The cache is per-request, so it never serves one visitor another's data
// and never outlives the render — page freshness is still `revalidate`'s job.

/**
 * The catalogue, and it THROWS if the database is unreachable.
 *
 * `/api/tours` reads through this one: an endpoint that answers `[]` when
 * Postgres is down is indistinguishable from an empty catalogue, and telling
 * those two apart is the whole reason the endpoint exists.
 */
export const listPublishedTours = cache(async (): Promise<Tour[]> => {
  const rows = await db
    .select()
    .from(tours)
    .where(eq(tours.isPublished, true))
    .orderBy(...DISPLAY_ORDER);

  return rows.map(toTour);
});

/** Featured tours only — the landing page strip. Throws, as `listPublishedTours` does. */
export const listFeaturedTours = cache(async (limit = 3): Promise<Tour[]> => {
  const rows = await db
    .select()
    .from(tours)
    .where(and(eq(tours.isPublished, true), eq(tours.featured, true)))
    .orderBy(...DISPLAY_ORDER)
    .limit(limit);

  return rows.map(toTour);
});

export const getPublishedTours = cache(async (): Promise<Tour[]> => {
  try {
    return await listPublishedTours();
  } catch (error) {
    console.error('[tours] could not load the catalogue:', error);
    return [];
  }
});

/** The landing page strip. Featured tours only, newest ordering rules applied. */
export const getFeaturedTours = cache(async (limit = 3): Promise<Tour[]> => {
  try {
    return await listFeaturedTours(limit);
  } catch (error) {
    console.error('[tours] could not load featured tours:', error);
    return [];
  }
});

/**
 * Deliberately does NOT swallow errors — see the note at the top of the file.
 * A 500 is more honest than a 404 on a tour that exists.
 */
export const getPublishedTourBySlug = cache(async (slug: string): Promise<Tour | null> => {
  const [row] = await db
    .select()
    .from(tours)
    .where(and(eq(tours.slug, slug), eq(tours.isPublished, true)))
    .limit(1);

  return row ? toTour(row) : null;
});

// --- Admin portal -----------------------------------------------------------

export async function listTours(): Promise<TourListItem[]> {
  const rows = await db.select().from(tours).orderBy(...DISPLAY_ORDER);
  return rows.map(toListItem);
}

export async function getTourById(id: string): Promise<TourRecord | null> {
  const [row] = await db
    .select({ tour: tours, updatedByName: adminUsers.name })
    .from(tours)
    .leftJoin(adminUsers, eq(adminUsers.id, tours.updatedBy))
    .where(eq(tours.id, id))
    .limit(1);

  return row ? toTourRecord(row.tour, row.updatedByName) : null;
}

/** True when another tour already owns this slug. */
export async function isSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  const filters: SQL[] = [eq(tours.slug, slug)];
  if (excludeId) filters.push(ne(tours.id, excludeId));

  const [row] = await db
    .select({ id: tours.id })
    .from(tours)
    .where(and(...filters))
    .limit(1);

  return Boolean(row);
}

/**
 * The slug a tour will actually get: the admin's own if it is free, otherwise
 * the same stem with `-2`, `-3`… appended. Falls back to the title when no slug
 * was typed, which is the create-form's normal path.
 */
export async function resolveSlug(input: {
  slug?: string | null;
  title: string;
  excludeId?: string;
}): Promise<string> {
  const base = input.slug?.trim() || input.title;
  return uniqueSlug(base, (candidate) => isSlugTaken(candidate, input.excludeId), 'tour');
}

/** Postgres unique-violation — two admins saving the same new slug at once. */
function isUniqueViolation(error: unknown): boolean {
  return (error as { code?: string })?.code === '23505';
}

export async function createTour(input: TourInput, adminId: string): Promise<TourRecord> {
  // Resolving the slug and inserting it are two statements, so a concurrent
  // save can still win the race. Retrying re-resolves against the row that just
  // landed, which is exactly what a second attempt needs to do.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const slug = await resolveSlug({ slug: input.slug, title: input.title });

    try {
      const [row] = await db
        .insert(tours)
        .values({
          slug,
          title: input.title,
          shortDescription: input.shortDescription,
          description: input.description,
          image: input.image,
          gallery: input.gallery,
          duration: input.duration,
          featured: input.featured,
          isPublished: input.isPublished,
          sortOrder: input.sortOrder,
          pricing: input.pricing,
          itinerary: input.itinerary,
          inclusions: input.inclusions,
          exclusions: input.exclusions,
          createdBy: adminId,
          updatedBy: adminId,
        })
        .returning();

      return toTourRecord(row, null);
    } catch (error) {
      if (!isUniqueViolation(error) || attempt === 2) throw error;
    }
  }

  throw new Error('Could not allocate a unique slug for this tour');
}

export async function updateTour(
  id: string,
  patch: TourPatch,
  adminId: string
): Promise<TourRecord | null> {
  const values: Partial<NewTourRow> = { updatedBy: adminId, updatedAt: new Date() };

  if (patch.title !== undefined) values.title = patch.title;
  if (patch.shortDescription !== undefined) values.shortDescription = patch.shortDescription;
  if (patch.description !== undefined) values.description = patch.description;
  if (patch.image !== undefined) values.image = patch.image;
  if (patch.gallery !== undefined) values.gallery = patch.gallery;
  if (patch.duration !== undefined) values.duration = patch.duration;
  if (patch.featured !== undefined) values.featured = patch.featured;
  if (patch.isPublished !== undefined) values.isPublished = patch.isPublished;
  if (patch.sortOrder !== undefined) values.sortOrder = patch.sortOrder;
  if (patch.pricing !== undefined) values.pricing = patch.pricing;
  if (patch.itinerary !== undefined) values.itinerary = patch.itinerary;
  if (patch.inclusions !== undefined) values.inclusions = patch.inclusions;
  if (patch.exclusions !== undefined) values.exclusions = patch.exclusions;

  // The slug is only touched when the caller actually sends one. Renaming a
  // tour must not silently move a live URL that Google and past customers hold,
  // and the table's publish/feature toggles must not either. Sending an empty
  // slug is the explicit "re-derive it from the title" request.
  if (patch.slug !== undefined) {
    const [current] = await db
      .select({ slug: tours.slug, title: tours.title })
      .from(tours)
      .where(eq(tours.id, id))
      .limit(1);

    if (!current) return null;

    const wanted = patch.slug.trim() || patch.title || current.title;
    if (wanted !== current.slug) {
      values.slug = await resolveSlug({
        slug: wanted,
        title: patch.title ?? current.title,
        excludeId: id,
      });
    }
  }

  const [row] = await db.update(tours).set(values).where(eq(tours.id, id)).returning();
  if (!row) return null;

  return toTourRecord(row, null);
}

export async function deleteTour(id: string): Promise<boolean> {
  const [row] = await db.delete(tours).where(eq(tours.id, id)).returning({ id: tours.id });
  return Boolean(row);
}

/** How many tours exist at all — the empty-state check for the portal. */
export async function countTours(): Promise<number> {
  const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(tours);
  return row?.count ?? 0;
}
