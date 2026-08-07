/**
 * Fleet data access for the admin portal.
 *
 * Thin wrappers over /api/admin/vehicles/**, so the pages stay declarative —
 * the same shape as `tour.service`.
 *
 * There is no upload helper here: images go through the shared
 * `uploadCatalogueImage` in `tour.service`, which both catalogues use.
 */

import { apiClient } from '@/services/api-client';
import type { VehicleInput, VehiclePatch } from '@/models/vehicle.schema';
import type { VehicleListItem, VehicleRecord } from '@/types/vehicle';

export const listVehicles = async (): Promise<{ items: VehicleListItem[] }> => {
  const response = await apiClient.get('/api/admin/vehicles');
  return (await response.json()) as { items: VehicleListItem[] };
};

export const getVehicle = async (id: string): Promise<{ vehicle: VehicleRecord }> => {
  const response = await apiClient.get(`/api/admin/vehicles/${id}`);
  return (await response.json()) as { vehicle: VehicleRecord };
};

export const createVehicle = async (input: VehicleInput): Promise<{ vehicle: VehicleRecord }> => {
  const response = await apiClient.post('/api/admin/vehicles', input);
  return (await response.json()) as { vehicle: VehicleRecord };
};

export const updateVehicle = async (
  id: string,
  patch: VehiclePatch
): Promise<{ vehicle: VehicleRecord }> => {
  const response = await apiClient.patch(`/api/admin/vehicles/${id}`, patch);
  return (await response.json()) as { vehicle: VehicleRecord };
};

export const deleteVehicle = async (id: string): Promise<{ success: true }> => {
  const response = await apiClient.delete(`/api/admin/vehicles/${id}`);
  return (await response.json()) as { success: true };
};

export interface SlugSuggestion {
  slug: string;
  available: boolean;
}

/**
 * What the vehicle's URL will be — used to preview the slug as the models are
 * typed. `models` and `type` are both sent because the derived slug carries the
 * class ("vios-mirage-g4-at-sedan"), which is what keeps two sedans apart.
 */
export const suggestSlug = async (input: {
  models?: string;
  type?: string;
  slug?: string;
  excludeId?: string;
}): Promise<SlugSuggestion> => {
  const params = new URLSearchParams();
  if (input.models) params.set('models', input.models);
  if (input.type) params.set('type', input.type);
  if (input.slug) params.set('slug', input.slug);
  if (input.excludeId) params.set('excludeId', input.excludeId);

  const response = await apiClient.get(`/api/admin/vehicles/slug?${params.toString()}`);
  return (await response.json()) as SlugSuggestion;
};
