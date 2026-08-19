/**
 * Shrink a customer's payment screenshot in their browser before it is uploaded.
 * Client-only (Canvas API) — call it from an event handler, never on the server.
 *
 * This is the phone path, and it is the whole reason the upload works at all:
 *
 *   - A modern phone photo is 12–48 MP. Drawing one at full resolution blows
 *     past iOS Safari's canvas limit (`toBlob` returns null) or kills the tab.
 *     Downscaling first avoids both.
 *   - iPhone screenshots and photos can be HEIC, which no browser will render
 *     in an <img> preview and no CRM user wants to open. Re-encoding fixes it.
 *   - Serverless request bodies cap out around 4.5 MB. A 1600px WebP is a few
 *     hundred KB, so the upload stays comfortably inside that.
 *
 * The original File is returned unchanged only when there is nothing to do
 * (already WebP and already small enough, not an image) or when
 * decoding/encoding fails outright — the upload is never lost just because
 * optimisation didn't work.
 *
 * `targetBytes` turns the single pass into a ladder: one 1600px encode covers a
 * phone photo, but a poster-sized PNG or a screenshot full of noise can still
 * land above a caller's ceiling, so quality and then size step down until it
 * fits. That is what lets an upload field accept a picture of any size rather
 * than asking an admin to go and shrink it. `minWidth`/`minHeight` put a floor
 * under that ladder, so a field with a minimum cannot have compression quietly
 * push an image below the size it just insisted on.
 */

/** Longest-edge cap. Keeps a receipt legible while staying small. */
const MAX_DIMENSION = 1600;

/** Ceiling for the memory-safe resized decode used when a full decode fails. */
const MAX_DECODE_DIMENSION = 2048;

/**
 * Walked in order when the first encode overshoots `targetBytes`. Quality goes
 * first because it costs the least to look at; the longest edge only starts
 * dropping once quality alone hasn't done it. `scale` is a fraction of the
 * caller's own cap, and is clamped by the floor — past that point the rungs
 * only trade quality, never pixels.
 */
const FIT_ATTEMPTS: ReadonlyArray<{ scale: number; quality: number }> = [
  { scale: 1, quality: 0.7 },
  { scale: 0.8, quality: 0.6 },
  { scale: 0.64, quality: 0.55 },
  { scale: 0.5, quality: 0.5 },
  { scale: 0.4, quality: 0.4 },
];

export interface OptimizeImageOptions {
  /** Encoder quality for the first pass. */
  quality?: number;
  /** Longest edge to keep. Never upscales a smaller image. */
  maxDimension?: number;
  /**
   * Byte ceiling the result must fit under. Unbounded by default — a caller
   * with an upload cap should pass theirs so the fallback ladder is used.
   */
  targetBytes?: number;
  /** Pixel floor the result must stay at or above, whatever `targetBytes` says. */
  minWidth?: number;
  minHeight?: number;
}

function toBlobAsync(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), type, quality));
}

/** WebP where it exists, JPEG everywhere else (older iOS Safari can't encode WebP). */
async function encodeCanvas(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<{ blob: Blob; mime: string; ext: string } | null> {
  const webp = await toBlobAsync(canvas, 'image/webp', quality);
  if (webp && webp.type === 'image/webp') {
    return { blob: webp, mime: 'image/webp', ext: 'webp' };
  }

  const jpeg = await toBlobAsync(canvas, 'image/jpeg', quality);
  if (jpeg && jpeg.type === 'image/jpeg') {
    return { blob: jpeg, mime: 'image/jpeg', ext: 'jpg' };
  }

  return null;
}

export async function optimizeImageForUpload(
  file: File,
  {
    quality = 0.85,
    maxDimension = MAX_DIMENSION,
    targetBytes = Number.POSITIVE_INFINITY,
    minWidth = 0,
    minHeight = 0,
  }: OptimizeImageOptions = {}
): Promise<File> {
  if (!file.type.startsWith('image/')) {
    return file;
  }

  // A WebP is already in the format we would encode to — re-encoding only earns
  // its keep when the file still has to get under a ceiling.
  if (file.type === 'image/webp' && file.size <= targetBytes) {
    return file;
  }

  let bitmap: ImageBitmap | null = null;
  let objectUrl: string | null = null;

  try {
    // --- Decode, without running the phone out of memory --------------------
    if (typeof createImageBitmap === 'function') {
      try {
        bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      } catch {
        try {
          // Some browsers reject the orientation option but decode fine without it.
          bitmap = await createImageBitmap(file);
        } catch {
          bitmap = null;
        }
      }

      if (!bitmap) {
        try {
          // Resized decode: never materialises the full photo. Only reached
          // after a full decode failed, so it can't upscale a small image.
          bitmap = await createImageBitmap(file, {
            resizeWidth: MAX_DECODE_DIMENSION,
            resizeQuality: 'high',
            imageOrientation: 'from-image',
          });
        } catch {
          bitmap = null; // Fall through to <img>, which decodes HEIC on Safari.
        }
      }
    }

    let width: number;
    let height: number;
    let source: ImageBitmap | HTMLImageElement;

    if (bitmap) {
      width = bitmap.width;
      height = bitmap.height;
      source = bitmap;
    } else {
      objectUrl = URL.createObjectURL(file);
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const element = new Image();
        element.onload = () => resolve(element);
        element.onerror = () => reject(new Error('Image load failed'));
        element.src = objectUrl as string;
      });
      width = image.naturalWidth;
      height = image.naturalHeight;
      source = image;
    }

    if (!width || !height) throw new Error('Zero-size image');

    // --- Downscale to the longest edge (never upscale, never below the floor) -
    //
    // An image that already starts below the floor cannot be brought up to it,
    // and upscaling would only invent pixels — so the floor is itself capped at
    // 1. The field's own check is what rejects those; this only makes sure the
    // shrinking does not create one.
    const floorScale = Math.min(1, Math.max(minWidth / width, minHeight / height) || 0);

    const drawAndEncode = async (longestEdge: number, encodeQuality: number) => {
      const fit = Math.min(1, longestEdge / Math.max(width, height));
      const scale = Math.max(fit, floorScale);
      const targetWidth = Math.max(1, Math.round(width * scale));
      const targetHeight = Math.max(1, Math.round(height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const context = canvas.getContext('2d');
      if (!context) throw new Error('No 2D context');
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.drawImage(source, 0, 0, targetWidth, targetHeight);

      return encodeCanvas(canvas, encodeQuality);
    };

    let encoded = await drawAndEncode(maxDimension, quality);
    if (!encoded) return file;

    // --- Still over the caller's ceiling: step down until it fits ------------
    for (const attempt of FIT_ATTEMPTS) {
      if (encoded.blob.size <= targetBytes) break;

      const smaller = await drawAndEncode(maxDimension * attempt.scale, attempt.quality);
      // A rung that came out no smaller (the floor already had it pinned, or
      // the encoder ignored the quality) is discarded rather than kept for its
      // lower detail.
      if (smaller && smaller.blob.size < encoded.blob.size) encoded = smaller;
    }

    const dot = file.name.lastIndexOf('.');
    const base = dot > 0 ? file.name.slice(0, dot) : file.name || 'proof-of-payment';

    return new File([encoded.blob], `${base}.${encoded.ext}`, {
      type: encoded.mime,
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  } finally {
    if (bitmap) bitmap.close();
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}
