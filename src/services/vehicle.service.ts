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
