/**
 * Admin authentication calls (plan §9.3).
 *
 * The session lives in an httpOnly cookie, so nothing here handles tokens —
 * the browser attaches the cookie automatically on same-origin requests.
 */

import { apiClient } from '@/services/api-client';
import type { AdminSummary } from '@/models/crm.types';
import type { LoginFormData } from '@/models/validation-schemas';

export const login = async (credentials: LoginFormData): Promise<AdminSummary> => {
  const response = await apiClient.post('/api/auth/login', credentials);
  const data = (await response.json()) as { user: AdminSummary };
  return data.user;
};

export const logout = async (): Promise<void> => {
  await apiClient.post('/api/auth/logout');
};

/** Returns null when the caller is not signed in, instead of throwing. */
export const me = async (): Promise<AdminSummary | null> => {
  try {
    const response = await apiClient.get('/api/auth/me');
    const data = (await response.json()) as { user: AdminSummary };
    return data.user;
  } catch {
    return null;
  }
};
