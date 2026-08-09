/**
 * Campaign data access for the admin portal.
 *
 * Thin wrappers over /api/admin/campaigns/**, so the pages stay declarative —
 * the same shape as `tour.service` and `vehicle.service`.
 *
 * There is no upload helper here: banners go through the shared
 * `uploadTourImage` in `tour.service`, which every catalogue uses.
 */

import { apiClient } from '@/services/api-client';
import type { CampaignInput, CampaignPatch } from '@/models/campaign.schema';
import type { CampaignListItem, CampaignRecord } from '@/types/campaign';

export const listCampaigns = async (): Promise<{ items: CampaignListItem[] }> => {
  const response = await apiClient.get('/api/admin/campaigns');
  return (await response.json()) as { items: CampaignListItem[] };
};

export const getCampaign = async (id: string): Promise<{ campaign: CampaignRecord }> => {
  const response = await apiClient.get(`/api/admin/campaigns/${id}`);
  return (await response.json()) as { campaign: CampaignRecord };
};

export const createCampaign = async (
  input: CampaignInput
): Promise<{ campaign: CampaignRecord }> => {
  const response = await apiClient.post('/api/admin/campaigns', input);
  return (await response.json()) as { campaign: CampaignRecord };
};

export const updateCampaign = async (
  id: string,
  patch: CampaignPatch
): Promise<{ campaign: CampaignRecord }> => {
  const response = await apiClient.patch(`/api/admin/campaigns/${id}`, patch);
  return (await response.json()) as { campaign: CampaignRecord };
};

export const deleteCampaign = async (id: string): Promise<{ success: true }> => {
  const response = await apiClient.delete(`/api/admin/campaigns/${id}`);
  return (await response.json()) as { success: true };
};

export interface SlugSuggestion {
  slug: string;
  available: boolean;
}

/** What the promo's URL will be — used to preview the slug as the name is typed. */
export const suggestSlug = async (input: {
  name?: string;
  slug?: string;
  excludeId?: string;
}): Promise<SlugSuggestion> => {
  const params = new URLSearchParams();
  if (input.name) params.set('name', input.name);
  if (input.slug) params.set('slug', input.slug);
  if (input.excludeId) params.set('excludeId', input.excludeId);

  const response = await apiClient.get(`/api/admin/campaigns/slug?${params.toString()}`);
  return (await response.json()) as SlugSuggestion;
};
