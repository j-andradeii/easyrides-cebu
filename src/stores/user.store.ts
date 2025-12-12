/**
 * Basic Store Pattern - User Store
 *
 * Example of a persistent store using localStorage middleware
 * Stores user authentication and profile data
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface UserState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: User, token: string, refreshToken?: string) => void;
  setTokens: (token: string, refreshToken: string) => void;
  clearUser: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,

      setUser: (user, token, refreshToken) =>
        set({
          user,
          token,
          refreshToken: refreshToken || null,
          isAuthenticated: true,
        }),

      setTokens: (token, refreshToken) =>
        set({
          token,
          refreshToken,
        }),

      clearUser: () =>
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
