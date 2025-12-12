/**
 * Loading Bar Store
 *
 * Tracks active API requests to show/hide loading indicators
 */

import { create } from 'zustand';

interface LoadingBarState {
  activeRequests: number;
  isLoading: boolean;
  incrementRequests: () => void;
  decrementRequests: () => void;
  reset: () => void;
}

export const useLoadingBarStore = create<LoadingBarState>((set) => ({
  activeRequests: 0,
  isLoading: false,

  incrementRequests: () =>
    set((state) => ({
      activeRequests: state.activeRequests + 1,
      isLoading: true,
    })),

  decrementRequests: () =>
    set((state) => {
      const newCount = Math.max(0, state.activeRequests - 1);
      return {
        activeRequests: newCount,
        isLoading: newCount > 0,
      };
    }),

  reset: () =>
    set({
      activeRequests: 0,
      isLoading: false,
    }),
}));
