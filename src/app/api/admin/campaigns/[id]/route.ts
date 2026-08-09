/**
 * /api/admin/campaigns/[id] — read, edit and remove one promo page.
 *
 * PATCH takes a partial body on purpose: the edit form sends the whole
 * campaign, while the table's publish switch sends a single field.
 */

import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { AdminRouteError, handleAdminRoute } from '@/lib/auth/require-admin';
import { deleteCampaign, getCampaignById, updateCampaign } from '@/lib/campaigns/repository';
import { revalidateCampaignPages } from '@/lib/campaigns/revalidate';
import { onlySentKeys } from '@/lib/patch-body';
import { campaignPatchSchema } from '@/models/campaign.schema';
import type { CampaignRecord } from '@/types/campaign';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  return handleAdminRoute(async (): Promise<{ campaign: CampaignRecord }> => {
    const campaign = await getCampaignById(id);
    if (!campaign) throw new AdminRouteError('Campaign not found', 404);

    return { campaign };
  });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  return handleAdminRoute(async (admin): Promise<{ campaign: CampaignRecord }> => {
    const body = await request.json().catch(() => null);
    const parsed = campaignPatchSchema.safeParse(body);
    if (!parsed.success) {
      throw new AdminRouteError(
        parsed.error.issues[0]?.message ?? 'Please check the campaign details',
        400,
        // Per field, so the editor marks the inputs rather than just apologising.
        z.flattenError(parsed.error).fieldErrors as Record<string, string[]>
      );
    }

    const existing = await getCampaignById(id);
    if (!existing) throw new AdminRouteError('Campaign not found', 404);

    // The publish switch sends one field; everything it did not send must stay
    // as it is — see `onlySentKeys` for why zod alone does not guarantee that.
    const campaign = await updateCampaign(id, onlySentKeys(body, parsed.data), admin.id);
    if (!campaign) throw new AdminRouteError('Campaign not found', 404);

    // The old slug too: a rename leaves a cached page at the previous URL.
    revalidateCampaignPages(existing.slug, campaign.slug);

    return { campaign };
  });
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  // Deleting breaks a link that may already be sitting in a social post, so it
  // is owner/admin work — an agent can unpublish instead, which is reversible.
  return handleAdminRoute(
    async (): Promise<{ success: true }> => {
      const existing = await getCampaignById(id);
      if (!existing) throw new AdminRouteError('Campaign not found', 404);

      const removed = await deleteCampaign(id);
      if (!removed) throw new AdminRouteError('Campaign not found', 404);

      revalidateCampaignPages(existing.slug);

      return { success: true as const };
    },
    { roles: ['owner', 'admin'] }
  );
}
