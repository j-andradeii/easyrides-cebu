/**
 * Pushes a tour edit onto the live site immediately.
 *
 * The public tour pages now render per request (`dynamic = 'force-dynamic'`), so
 * the server no longer holds a stale copy to bust. What this still clears is the
 * client-side Router Cache: a visitor who has prefetched /tours would otherwise
 * keep showing the payload from before the edit for the rest of their session.
 * Every path that renders tour data is listed here.
 */

import 'server-only';

import { revalidatePath } from 'next/cache';

export function revalidateTourPages(...slugs: (string | null | undefined)[]): void {
  // Landing page (featured strip), the catalogue, and the sitemap.
  revalidatePath('/');
  revalidatePath('/tours');
  revalidatePath('/sitemap.xml');

  // Both the old and the new slug when a tour was renamed.
  for (const slug of new Set(slugs.filter(Boolean))) {
    revalidatePath(`/tours/${slug}`);
  }
}
