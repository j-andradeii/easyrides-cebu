/**
 * Pushes a campaign edit onto the live site immediately.
 *
 * More urgent here than for tours or the fleet: a promo link is pasted into a
 * social post minutes after it is created, and Facebook fetches the og:image
 * the first time anyone shares it. A stale page at that moment is the wrong
 * banner cached on Facebook's side for the life of the post.
 */

import 'server-only';

import { revalidatePath } from 'next/cache';

export function revalidateCampaignPages(...slugs: (string | null | undefined)[]): void {
  revalidatePath('/sitemap.xml');

  // Both the old and the new slug when a campaign was renamed.
  for (const slug of new Set(slugs.filter(Boolean))) {
    revalidatePath(`/promo/${slug}`);
  }
}
