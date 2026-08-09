/**
 * POST /api/admin/campaigns/images — upload a promo banner.
 *
 * The banner is stored under "campaigns/" in blob storage and the campaign
 * keeps only the returned URL, saved with the campaign itself through POST /
 * PATCH /api/admin/campaigns.
 *
 * That URL is the page's og:image, so it has to be publicly fetchable by
 * Facebook's crawler — which is exactly what blob storage gives us and what an
 * admin-authenticated route (the way payment proofs are served) could not.
 *
 * Same handler as the tours and fleet routes — see `uploadCatalogueImage` for
 * why an upload's real type is read from its bytes rather than believed.
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
    return uploadCatalogueImage(request, 'campaigns');
  });
}
