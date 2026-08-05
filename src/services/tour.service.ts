/**
 * Tour catalogue data access for the admin portal.
 *
 * Thin wrappers over /api/admin/tours/**, so the pages stay declarative — the
 * same shape as `inquiry.service`.
 */

import { apiClient } from '@/services/api-client';
import type { TourInput, TourPatch } from '@/models/tour.schema';
import type { TourListItem, TourRecord } from '@/types/tour';

export const listTours = async (): Promise<{ items: TourListItem[] }> => {
  const response = await apiClient.get('/api/admin/tours');
  return (await response.json()) as { items: TourListItem[] };
};

export const getTour = async (id: string): Promise<{ tour: TourRecord }> => {
  const response = await apiClient.get(`/api/admin/tours/${id}`);
  return (await response.json()) as { tour: TourRecord };
};

export const createTour = async (input: TourInput): Promise<{ tour: TourRecord }> => {
  const response = await apiClient.post('/api/admin/tours', input);
  return (await response.json()) as { tour: TourRecord };
};

export const updateTour = async (
  id: string,
  patch: TourPatch
): Promise<{ tour: TourRecord }> => {
  const response = await apiClient.patch(`/api/admin/tours/${id}`, patch);
  return (await response.json()) as { tour: TourRecord };
};

export const deleteTour = async (id: string): Promise<{ success: true }> => {
  const response = await apiClient.delete(`/api/admin/tours/${id}`);
  return (await response.json()) as { success: true };
};

export interface SlugSuggestion {
  slug: string;
  available: boolean;
}

/** What the tour's URL will be — used to preview the slug as the title is typed. */
export const suggestSlug = async (input: {
  title?: string;
  slug?: string;
  excludeId?: string;
}): Promise<SlugSuggestion> => {
  const params = new URLSearchParams();
  if (input.title) params.set('title', input.title);
  if (input.slug) params.set('slug', input.slug);
  if (input.excludeId) params.set('excludeId', input.excludeId);

  const response = await apiClient.get(`/api/admin/tours/slug?${params.toString()}`);
  return (await response.json()) as SlugSuggestion;
};

/**
 * Uploads one image and returns its public URL.
 *
 * Plain `fetch`, not `apiClient`: the shared client forces a JSON Content-Type,
 * which would strip the multipart boundary the upload needs.
 */
export const uploadTourImage = async (file: File): Promise<string> => {
  const form = new FormData();
  form.append('file', file, file.name);

  const response = await fetch('/api/admin/tours/images', { method: 'POST', body: form });
  const data = (await response.json().catch(() => ({}))) as { url?: string; message?: string };

  if (!response.ok || !data.url) {
    throw new Error(data.message ?? 'Could not upload that image');
  }

  return data.url;
};
