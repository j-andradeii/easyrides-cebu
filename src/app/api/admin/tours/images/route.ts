/**
 * POST /api/admin/tours/images — upload a tour banner or gallery photo.
 *
 * The work lives in `uploadCatalogueImage`, which the fleet's own image route
 * shares: validation, the magic-byte MIME check and the blob naming are the
 * same for a tour banner and a car photo, and must stay that way.
 */

import type { NextRequest } from 'next/server';

import { handleAdminRoute } from '@/lib/auth/require-admin';
import {
  uploadCatalogueImage,
  type CatalogueImageUploadResult,
} from '@/lib/catalogue-image-upload';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  return handleAdminRoute(async (): Promise<CatalogueImageUploadResult> => {
    return uploadCatalogueImage(request, 'tours');
  });
}
