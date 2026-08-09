/**
 * GET /api/admin/campaigns/slug?name=…&slug=…&excludeId=…
 *
 * Answers "what will this promo's URL actually be?" while the admin is still
 * typing. The save path applies the same rule (`resolveSlug`), so the preview
 * the form shows is the URL that gets stored — no surprise renames after a link
 * has been pasted somewhere. Identical to the tours and fleet endpoints.
 */

import type { NextRequest } from 'next/server';

import { AdminRouteError, handleAdminRoute } from '@/lib/auth/require-admin';
import { resolveSlug } from '@/lib/campaigns/repository';
import { slugify } from '@/lib/slug';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export interface SlugSuggestion {
  /** The slug this campaign would be saved with. */
  slug: string;
  /** False when the requested slug was taken and had to be suffixed. */
  available: boolean;
}

export async function GET(request: NextRequest) {
  return handleAdminRoute(async (): Promise<SlugSuggestion> => {
    const params = request.nextUrl.searchParams;
    const name = params.get('name')?.trim() ?? '';
    const requested = params.get('slug')?.trim() ?? '';
    const excludeId = params.get('excludeId')?.trim() || undefined;

    if (!name && !requested) {
      throw new AdminRouteError('Pass the name or a slug', 400);
    }

    const wanted = slugify(requested || name);
    // resolveSlug returns the requested stem untouched only when it is free, so
    // an unchanged answer *is* the availability answer.
    const slug = await resolveSlug({ slug: wanted, name, excludeId });

    return { slug, available: slug === wanted };
  });
}
