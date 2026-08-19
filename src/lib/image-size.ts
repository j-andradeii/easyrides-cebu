/**
 * How big a picked image actually is, in pixels. Client-only (needs a decoder) —
 * call it from an event handler, never on the server.
 *
 * This is what lets an upload field refuse a picture that is too small to be
 * worth publishing. Bytes say nothing useful about that: a heavily compressed
 * 3000px photo can weigh less than a 400px screenshot, so the only honest check
 * is the pixel count.
 *
 * Orientation is resolved before measuring. A phone holds its sensor one way and
 * writes "rotate this" into the EXIF, so a landscape photo can be stored as
 * portrait pixels — measuring those raw would report a 4032 × 3024 shot as
 * 3024 × 4032 and reject a banner that is fine.
 */

export interface ImageSize {
  width: number;
  height: number;
}

/** Null when the browser cannot decode the file at all. */
export async function readImageSize(file: File): Promise<ImageSize | null> {
  const fromBitmap = await sizeFromBitmap(file);
  if (fromBitmap) return fromBitmap;

  // <img> is the fallback rather than the first choice because it is slower,
  // but it decodes HEIC on Safari where createImageBitmap will not.
  return sizeFromElement(file);
}

async function sizeFromBitmap(file: File): Promise<ImageSize | null> {
  if (typeof createImageBitmap !== 'function') return null;

  let bitmap: ImageBitmap | null = null;

  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' }).catch(() =>
      // Some browsers reject the orientation option but decode fine without it.
      createImageBitmap(file)
    );

    return bitmap.width && bitmap.height ? { width: bitmap.width, height: bitmap.height } : null;
  } catch {
    return null;
  } finally {
    bitmap?.close();
  }
}

async function sizeFromElement(file: File): Promise<ImageSize | null> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('Image load failed'));
      element.src = objectUrl;
    });

    return image.naturalWidth && image.naturalHeight
      ? { width: image.naturalWidth, height: image.naturalHeight }
      : null;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
