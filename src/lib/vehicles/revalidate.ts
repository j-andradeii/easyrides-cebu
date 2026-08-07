/**
 * Pushes a fleet edit onto the live site immediately.
 *
 * The landing page now renders per request (`dynamic = 'force-dynamic'` in
 * app/page.tsx), so this clears the client-side Router Cache rather than a
 * server-held copy — see the note in `lib/tours/revalidate`. Since the fleet
 * gained its own /fleet/[slug] pages there is more than the landing page to
 * bust, so the changed slugs come in too.
 */

import 'server-only';

import { revalidatePath } from 'next/cache';

export function revalidateFleetPages(...slugs: (string | null | undefined)[]): void {
  // Landing page (the fleet grid) and the sitemap.
  revalidatePath('/');
  revalidatePath('/sitemap.xml');

  // Both the old and the new slug when a vehicle was renamed.
  for (const slug of new Set(slugs.filter(Boolean))) {
    revalidatePath(`/fleet/${slug}`);
  }
}
