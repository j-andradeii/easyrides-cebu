/**
 * POST /api/admin/tours/images — upload a tour banner or gallery photo.
 *
 * Tour photos are public marketing images, so unlike a payment screenshot they
 * belong in blob storage rather than in a database row behind an auth check:
 * the tour pages then serve them straight from the CDN through next/image.
 *
 * The declared Content-Type is attacker-controlled (and phones get it wrong on
 * their own), so the stored type comes from the file's magic bytes — an upload
 * that isn't really an image is rejected rather than parked on a public URL.
 */

import type { NextRequest } from 'next/server';
import { put } from '@vercel/blob';

import { AdminRouteError, handleAdminRoute } from '@/lib/auth/require-admin';
import { ensureExtension, resolveImageMime } from '@/lib/image-mime';
import { slugify } from '@/lib/tours/slug';
import { TOUR_IMAGE_MAX_BYTES } from '@/models/tour.schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** What browsers and next/image can actually display. */
const ALLOWED_MIMES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif']);

export interface TourImageUploadResult {
  url: string;
  contentType: string;
  size: number;
}

export async function POST(request: NextRequest) {
  return handleAdminRoute(async (): Promise<TourImageUploadResult> => {
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

    // Keep a readable name in the URL — "tours/oslob-whale-shark-a1b2.webp"
    // beats an opaque hash when someone is looking at the blob store later.
    const label = slugify(file.name.replace(/\.[^.]+$/, '')) || 'tour-image';
    // Buffer, not the bare Uint8Array: @vercel/blob's PutBody accepts the Node
    // type here, and this route is pinned to the Node runtime.
    const blob = await put(`tours/${ensureExtension(label, mime)}`, Buffer.from(bytes), {
      access: 'public',
      contentType: mime,
      // Two uploads named "banner.jpg" must not overwrite one another.
      addRandomSuffix: true,
    });

    return { url: blob.url, contentType: mime, size: bytes.byteLength };
  });
}
