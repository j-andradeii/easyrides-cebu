/**
 * Resettable Store Pattern
 *
 * Example store that can be reset to initial state
 * Useful for form state, filters, or temporary UI state
 */

import { create } from 'zustand';

interface ResettableState {
  // Example state
  filters: {
    search: string;
    category: string;
    status: string;
  };
  sortBy: string;
  page: number;

  // Actions
  setFilters: (filters: Partial<ResettableState['filters']>) => void;
  setSortBy: (sortBy: string) => void;
  setPage: (page: number) => void;
  reset: () => void;
}

const initialState = {
  filters: {
    search: '',
    category: '',
    status: '',
  },
  sortBy: 'createdAt',
  page: 1,
};

export const useResettableStore = create<ResettableState>((set) => ({
  ...initialState,

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  setSortBy: (sortBy) => set({ sortBy }),

  setPage: (page) => set({ page }),

  reset: () => set(initialState),
}));
