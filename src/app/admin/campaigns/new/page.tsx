/**
 * /admin/campaigns/new — create a promo page.
 *
 * The form owns validation; this page owns only what happens after a save:
 * straight into the new campaign's editor, where the share bar is — which is
 * the next thing anyone creating a campaign wants.
 */

'use client';

import { useRouter } from 'next/navigation';

import { CampaignForm } from '@/components/admin/CampaignForm';
import * as campaignService from '@/services/campaign.service';
import type { CampaignInput } from '@/models/campaign.schema';

export default function NewCampaignPage() {
  const router = useRouter();

  const create = async (values: CampaignInput) => {
    const { campaign } = await campaignService.createCampaign(values);
    router.push(`/admin/campaigns/${campaign.id}`);
  };

  return <CampaignForm onSubmit={create} />;
}
