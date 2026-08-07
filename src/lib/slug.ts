/**
 * URL slugs — the /tours/[slug] and /fleet/[slug] segments.
 *
 * Pure and isomorphic on purpose: the admin forms preview the slug while the
 * name is being typed, and the API derives the stored one the same way, so what
 * the editor sees is what gets saved.
 *
 * It lives outside `lib/tours` because the fleet publishes pages under the same
 * rule — one slugifier means /tours and /fleet can never drift apart.
 */

/** Longest slug we will generate. Long enough for every real tour or vehicle. */
export const SLUG_MAX_LENGTH = 80;

/**
 * "Moalboal & Canyoneering" → "moalboal-and-canyoneering".
 *
 * Accents are folded rather than dropped (Cebu place names carry them), and the
 * ampersand becomes "and" because "moalboal-canyoneering" reads like two tours.
 */
export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    // Strip the combining marks left behind by NFKD, so "Añejo" → "anejo".
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/-+$/g, '');
}

/**
 * Appends `-2`, `-3`, … until the slug is free.
 *
 * `isTaken` is injected so the same rule runs against the database on the server
 * and against an in-memory list in tests. `fallback` is what a name that
 * slugifies to nothing at all ("!!!") is published as.
 */
export async function uniqueSlug(
  base: string,
  isTaken: (candidate: string) => Promise<boolean>,
  fallback = 'item'
): Promise<string> {
  const root = slugify(base) || fallback;

  if (!(await isTaken(root))) return root;

  for (let suffix = 2; suffix < 1000; suffix += 1) {
    // Trim the root, not the suffix — a truncated "-12" would collide again.
    const tail = `-${suffix}`;
    const candidate = `${root.slice(0, SLUG_MAX_LENGTH - tail.length)}${tail}`;
    if (!(await isTaken(candidate))) return candidate;
  }

  // Practically unreachable; still better than looping forever.
  return `${root.slice(0, SLUG_MAX_LENGTH - 7)}-${Date.now().toString(36).slice(-6)}`;
}
