/**
 * /api/admin/tours/[id] — read, edit and remove one tour.
 *
 * PATCH takes a partial body on purpose: the edit form sends the whole tour,
 * while the table's publish / feature switches send a single field.
 */

import type { NextRequest } from 'next/server';

import { AdminRouteError, handleAdminRoute } from '@/lib/auth/require-admin';
import { sanitizeRichText } from '@/lib/sanitize-rich-text';
import { deleteTour, getTourById, updateTour } from '@/lib/tours/repository';
import { revalidateTourPages } from '@/lib/tours/revalidate';
import { tourPatchSchema } from '@/models/tour.schema';
import type { TourRecord } from '@/types/tour';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  return handleAdminRoute(async (): Promise<{ tour: TourRecord }> => {
    const tour = await getTourById(id);
    if (!tour) throw new AdminRouteError('Tour not found', 404);

    return { tour };
  });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  return handleAdminRoute(async (admin): Promise<{ tour: TourRecord }> => {
    const parsed = tourPatchSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      throw new AdminRouteError(
        parsed.error.issues[0]?.message ?? 'Please check the tour details',
        400
      );
    }

    const existing = await getTourById(id);
    if (!existing) throw new AdminRouteError('Tour not found', 404);

    const patch = { ...parsed.data };
    if (patch.description !== undefined) {
      patch.description = sanitizeRichText(patch.description);
    }

    const tour = await updateTour(id, patch, admin.id);
    if (!tour) throw new AdminRouteError('Tour not found', 404);

    // The old slug too: a rename leaves a cached page at the previous URL.
    revalidateTourPages(existing.slug, tour.slug);

    return { tour };
  });
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  // Removing a tour takes a live page off the site, so it is owner/admin work —
  // an agent can unpublish instead, which is reversible.
  return handleAdminRoute(
    async (): Promise<{ success: true }> => {
      const existing = await getTourById(id);
      if (!existing) throw new AdminRouteError('Tour not found', 404);

      const removed = await deleteTour(id);
      if (!removed) throw new AdminRouteError('Tour not found', 404);

      revalidateTourPages(existing.slug);

      return { success: true as const };
    },
    { roles: ['owner', 'admin'] }
  );
}
