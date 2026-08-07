/**
 * POST /api/admin/vehicles/images — upload a fleet photo.
 *
 * The card image and the /fleet/[slug] gallery both come through here. The
 * photo is stored under "vehicles/" in blob storage and the vehicle keeps only
 * the returned URL: `vehicles.image` for the headline shot, `vehicles.gallery`
 * for the rest, saved with the vehicle itself through POST/PATCH
 * /api/admin/vehicles.
 *
 * Same handler as the tours route — see `uploadCatalogueImage` for why an
 * upload's real type is read from its bytes rather than believed.
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
    return uploadCatalogueImage(request, 'vehicles');
  });
}
