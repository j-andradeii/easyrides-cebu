/**
 * GET /api/admin/tours/slug?title=…&slug=…&excludeId=…
 *
 * Answers "what will this tour's URL actually be?" while the admin is still
 * typing. The save path applies the same rule (`resolveSlug`), so the preview
 * the form shows is the URL that gets stored — no surprise renames.
 */

import type { NextRequest } from 'next/server';

import { AdminRouteError, handleAdminRoute } from '@/lib/auth/require-admin';
import { resolveSlug } from '@/lib/tours/repository';
import { slugify } from '@/lib/tours/slug';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export interface SlugSuggestion {
  /** The slug this tour would be saved with. */
  slug: string;
  /** False when the requested slug was taken and had to be suffixed. */
  available: boolean;
}

export async function GET(request: NextRequest) {
  return handleAdminRoute(async (): Promise<SlugSuggestion> => {
    const params = request.nextUrl.searchParams;
    const title = params.get('title')?.trim() ?? '';
    const requested = params.get('slug')?.trim() ?? '';
    const excludeId = params.get('excludeId')?.trim() || undefined;

    if (!title && !requested) {
      throw new AdminRouteError('Pass a title or a slug', 400);
    }

    const wanted = slugify(requested || title);
    // resolveSlug returns the requested stem untouched only when it is free, so
    // an unchanged answer *is* the availability answer.
    const slug = await resolveSlug({ slug: wanted, title, excludeId });

    return { slug, available: slug === wanted };
  });
}
