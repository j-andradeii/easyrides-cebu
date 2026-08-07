/**
 * GET /api/admin/vehicles/slug?models=…&type=…&slug=…&excludeId=…
 *
 * Answers "what will this vehicle's URL actually be?" while the admin is still
 * typing. The save path applies the same rule (`resolveSlug`), so the preview
 * the form shows is the URL that gets stored — no surprise renames. The tours
 * catalogue has the identical endpoint at /api/admin/tours/slug.
 */

import type { NextRequest } from 'next/server';

import { AdminRouteError, handleAdminRoute } from '@/lib/auth/require-admin';
import { slugify } from '@/lib/slug';
import { resolveSlug } from '@/lib/vehicles/repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export interface SlugSuggestion {
  /** The slug this vehicle would be saved with. */
  slug: string;
  /** False when the requested slug was taken and had to be suffixed. */
  available: boolean;
}

export async function GET(request: NextRequest) {
  return handleAdminRoute(async (): Promise<SlugSuggestion> => {
    const params = request.nextUrl.searchParams;
    const models = params.get('models')?.trim() ?? '';
    const type = params.get('type')?.trim() ?? '';
    const requested = params.get('slug')?.trim() ?? '';
    const excludeId = params.get('excludeId')?.trim() || undefined;

    if (!models && !requested) {
      throw new AdminRouteError('Pass the models or a slug', 400);
    }

    // A hand-typed slug is taken at face value; only a derived one picks up the
    // class, so /fleet stays unambiguous once a second sedan joins the fleet.
    const wanted = requested ? slugify(requested) : slugify(`${models} ${type}`);
    // resolveSlug returns the requested stem untouched only when it is free, so
    // an unchanged answer *is* the availability answer.
    const slug = await resolveSlug({ slug: wanted, models, type, excludeId });

    return { slug, available: slug === wanted };
  });
}
