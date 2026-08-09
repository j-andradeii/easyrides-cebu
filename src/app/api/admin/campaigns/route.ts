/**
 * /api/admin/campaigns — the portal's promo pages.
 *
 *   GET   list every campaign, published or not, with its lead numbers
 *   POST  create one
 */

import type { NextRequest } from 'next/server';

import { AdminRouteError, handleAdminRoute } from '@/lib/auth/require-admin';
import { createCampaign, listCampaigns } from '@/lib/campaigns/repository';
import { revalidateCampaignPages } from '@/lib/campaigns/revalidate';
import { campaignInputSchema } from '@/models/campaign.schema';
import type { CampaignListItem, CampaignRecord } from '@/types/campaign';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return handleAdminRoute(async (): Promise<{ items: CampaignListItem[] }> => {
    return { items: await listCampaigns() };
  });
}

export async function POST(request: NextRequest) {
  return handleAdminRoute(async (admin): Promise<{ campaign: CampaignRecord }> => {
    const parsed = campaignInputSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      throw new AdminRouteError(
        parsed.error.issues[0]?.message ?? 'Please check the campaign details',
        400
      );
    }

    const campaign = await createCampaign(parsed.data, admin.id);

    revalidateCampaignPages(campaign.slug);

    return { campaign };
  });
}
