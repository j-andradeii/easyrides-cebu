/**
 * The catalogue image uploader — SERVER ONLY.
 *
 * Tour banners, tour galleries and fleet photos are the same kind of thing: a
 * public marketing image that belongs in blob storage rather than in a database
 * row behind an auth check, so the pages can serve it straight from the CDN
 * through next/image. One handler covers all of them; the routes under
 * /api/admin/tours/images and /api/admin/vehicles/images are two doors into it,
 * differing only in which folder they default to.
 *
 * The declared Content-Type is attacker-controlled (and phones get it wrong on
 * their own), so the stored type comes from the file's magic bytes — an upload
 * that isn't really an image is rejected rather than parked on a public URL.
 */

import 'server-only';

import type { NextRequest } from 'next/server';
import { put } from '@vercel/blob';

import { AdminRouteError } from '@/lib/auth/require-admin';
import { ensureExtension, resolveImageMime } from '@/lib/image-mime';
import { slugify } from '@/lib/slug';
import { TOUR_IMAGE_MAX_BYTES } from '@/models/tour.schema';

/** What browsers and next/image can actually display. */
const ALLOWED_MIMES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif']);

/**
 * Where the blob lands. Whitelisted rather than taken as given — the folder ends
 * up in a public URL, so a caller must not be able to steer it anywhere.
 */
const ALLOWED_FOLDERS = new Set(['tours', 'vehicles']);

export interface CatalogueImageUploadResult {
  url: string;
  contentType: string;
  size: number;
}

/**
 * Reads the multipart body, validates the image and stores it.
 *
 * `defaultFolder` is where the blob goes when the request does not ask for one
 * — each route passes its own catalogue, so a form that posts no folder still
 * files the photo somewhere sensible.
 */
export async function uploadCatalogueImage(
  request: NextRequest,
  defaultFolder: 'tours' | 'vehicles'
): Promise<CatalogueImageUploadResult> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new AdminRouteError(
      'Image uploads are not configured — BLOB_READ_WRITE_TOKEN is missing.',
      503
    );
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get('file');

  if (!(file instanceof File) || file.size === 0) {
    throw new AdminRouteError('Choose an image to upload', 400);
  }
  if (file.size > TOUR_IMAGE_MAX_BYTES) {
    throw new AdminRouteError('That image is too large — keep it under 4 MB', 413);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = resolveImageMime(bytes, file.type || '', file.name);

  if (!mime || !ALLOWED_MIMES.has(mime)) {
    throw new AdminRouteError('Upload a PNG, JPG, WebP or AVIF image', 415);
  }

  const requested = form?.get('folder');
  const folder =
    typeof requested === 'string' && ALLOWED_FOLDERS.has(requested) ? requested : defaultFolder;

  // Keep a readable name in the URL — "tours/oslob-whale-shark-a1b2.webp"
  // beats an opaque hash when someone is looking at the blob store later.
  const label = slugify(file.name.replace(/\.[^.]+$/, '')) || `${folder}-image`;
  // Buffer, not the bare Uint8Array: @vercel/blob's PutBody accepts the Node
  // type here, and both routes are pinned to the Node runtime.
  const blob = await put(`${folder}/${ensureExtension(label, mime)}`, Buffer.from(bytes), {
    access: 'public',
    contentType: mime,
    // Two uploads named "banner.jpg" must not overwrite one another.
    addRandomSuffix: true,
  });

  return { url: blob.url, contentType: mime, size: bytes.byteLength };
}
