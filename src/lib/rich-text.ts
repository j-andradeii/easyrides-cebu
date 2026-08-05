/**
 * Rich-text → plain text.
 *
 * Tour descriptions are stored as HTML (the portal's TipTap editor writes it),
 * but meta descriptions, JSON-LD and the admin table all need the words without
 * the markup. Isomorphic and dependency-free so the editor can count characters
 * with exactly the rule the server validates against.
 *
 * This is a *reader*, never a sanitiser — see `sanitizeRichText` for that.
 */

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  '#39': "'",
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  rsquo: '’',
  lsquo: '‘',
  ldquo: '“',
  rdquo: '”',
  peso: '₱',
};

function decodeEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
    const key = entity.toLowerCase();

    if (key.startsWith('#x')) {
      const code = Number.parseInt(entity.slice(2), 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    if (key.startsWith('#')) {
      const code = Number.parseInt(entity.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }

    return ENTITIES[key] ?? match;
  });
}

/** The visible text of a rich-text value, with block boundaries kept as spaces. */
export function richTextToPlainText(html: string | null | undefined): string {
  if (!html) return '';

  return decodeEntities(
    html
      // Anything scriptable is dropped whole — content and all.
      .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
      // Block ends become a space so "…falls</p><p>Then…" doesn't run together.
      .replace(/<\/(p|div|li|h[1-6]|blockquote|pre|tr)>/gi, ' ')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, '')
  )
    .replace(/\s+/g, ' ')
    .trim();
}

/** Plain text cut to `limit` characters on a word boundary, with an ellipsis. */
export function truncateText(value: string, limit: number): string {
  if (value.length <= limit) return value;

  const cut = value.slice(0, limit);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}
