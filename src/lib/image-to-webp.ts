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
 * (already WebP, not an image) or when decoding/encoding fails outright — the
 * upload is never lost just because optimisation didn't work.
 */

/** Longest-edge cap. Keeps a receipt legible while staying small. */
const MAX_DIMENSION = 1600;

/** Ceiling for the memory-safe resized decode used when a full decode fails. */
const MAX_DECODE_DIMENSION = 2048;

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

export async function optimizeImageForUpload(file: File, quality = 0.85): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/webp') {
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

    // --- Downscale to the longest edge (never upscale) ----------------------
    const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
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

    const encoded = await encodeCanvas(canvas, quality);
    if (!encoded) return file;

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
