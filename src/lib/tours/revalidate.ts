/**
 * Pushes a tour edit onto the live site immediately.
 *
 * The public tour pages are statically rendered and revalidated on a timer, so
 * without this an admin would save a price change and still see the old one.
 * Every path that renders tour data is listed here — miss one and it goes stale
 * until its own timer fires.
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
