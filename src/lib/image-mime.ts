/**
 * Image type detection — pure and isomorphic (no DOM, no Node globals), so the
 * checkout page and the upload route can share one answer.
 *
 * Never trust `File.type`: a screenshot dragged from a macOS floating thumbnail
 * arrives with an empty type, an Android share sheet can send
 * `application/octet-stream`, and a multipart Content-Type is attacker-supplied.
 * Magic bytes are the only thing that actually says what a file is.
 */

const IMAGE_EXTENSIONS: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  heic: 'image/heic',
  heif: 'image/heif',
  avif: 'image/avif',
  tif: 'image/tiff',
  tiff: 'image/tiff',
};

/** Sniff a raster image MIME from magic bytes. Null when it isn't an image. */
export function sniffImageMime(bytes: Uint8Array): string | null {
  const b = bytes;

  if (
    b.length >= 8 &&
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a
  ) return 'image/png';

  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';

  if (b.length >= 6 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) {
    return 'image/gif';
  }

  if (
    b.length >= 12 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  ) return 'image/webp';

  if (b.length >= 2 && b[0] === 0x42 && b[1] === 0x4d) return 'image/bmp';

  // ISO-BMFF (HEIC / HEIF / AVIF): an 'ftyp' box at offset 4, brand at 8.
  // iPhones still hand these out, so they have to be recognised even though the
  // browser converts them to WebP before upload.
  if (b.length >= 12 && b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) {
    const brand = String.fromCharCode(b[8], b[9], b[10], b[11]).toLowerCase();
    if (brand === 'avif' || brand === 'avis') return 'image/avif';
    if (brand.startsWith('hei') || brand.startsWith('mif') || brand.startsWith('msf')) {
      return 'image/heic';
    }
  }

  return null;
}

/** Map a filename extension to an image MIME. Null if it isn't a known image. */
export function mimeFromFilename(name: string): string | null {
  const dot = name.lastIndexOf('.');
  if (dot < 0) return null;
  return IMAGE_EXTENSIONS[name.slice(dot + 1).toLowerCase()] ?? null;
}

/**
 * Best-effort image MIME: sniffed bytes first, then a declared type that at
 * least claims to be an image, then the filename. Null when nothing says image.
 */
export function resolveImageMime(
  bytes: Uint8Array,
  declaredType: string,
  filename: string
): string | null {
  return (
    sniffImageMime(bytes) ??
    (declaredType.startsWith('image/') ? declaredType : null) ??
    mimeFromFilename(filename)
  );
}

/** Force a filename to carry the extension its MIME implies. */
export function ensureExtension(name: string, mime: string): string {
  const ext = (mime.split('/')[1] ?? 'png').split('+')[0].replace('jpeg', 'jpg');
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name || 'proof-of-payment';
  return `${base}.${ext}`;
}
