/**
 * Tour slugs — the /tours/[slug] segment.
 *
 * Pure and isomorphic on purpose: the admin form previews the slug while the
 * title is being typed, and the API derives the stored one the same way, so what
 * the editor sees is what gets saved.
 */

/** Longest slug we will generate. Long enough for every real tour name. */
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
 * and against an in-memory list in tests.
 */
export async function uniqueSlug(
  base: string,
  isTaken: (candidate: string) => Promise<boolean>
): Promise<string> {
  const root = slugify(base) || 'tour';

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
