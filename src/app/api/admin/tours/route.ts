/**
 * /api/admin/tours — the portal's view of the public tour catalogue.
 *
 *   GET   list every tour, published or not
 *   POST  create one
 */

import type { NextRequest } from 'next/server';

import { AdminRouteError, handleAdminRoute } from '@/lib/auth/require-admin';
import { sanitizeRichText } from '@/lib/sanitize-rich-text';
import { createTour, listTours } from '@/lib/tours/repository';
import { revalidateTourPages } from '@/lib/tours/revalidate';
import { tourInputSchema } from '@/models/tour.schema';
import type { TourListItem, TourRecord } from '@/types/tour';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return handleAdminRoute(async (): Promise<{ items: TourListItem[] }> => {
    return { items: await listTours() };
  });
}

export async function POST(request: NextRequest) {
  return handleAdminRoute(async (admin): Promise<{ tour: TourRecord }> => {
    const parsed = tourInputSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      throw new AdminRouteError(
        parsed.error.issues[0]?.message ?? 'Please check the tour details',
        400
      );
    }

    // Stored clean, so the public page can render it without sanitising on
    // every request — and so nothing unexpected can ever be served.
    const tour = await createTour(
      { ...parsed.data, description: sanitizeRichText(parsed.data.description) },
      admin.id
    );

    revalidateTourPages(tour.slug);

    return { tour };
  });
}
