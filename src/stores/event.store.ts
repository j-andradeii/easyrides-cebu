import { create } from 'zustand';
import { ApiEvent } from '@/models/api-event';


export interface ApiEventStore {
  currentEvent: ApiEvent | null;
  sendEvent: (event: ApiEvent) => void;
  subscribe: (callback: (event: ApiEvent | null) => void) => () => void;
  subscribers: ((event: ApiEvent | null) => void)[];
}

export const useApiEventStore = create<ApiEventStore>((set, get) => ({
    currentEvent: null,
    subscribers: [],
    sendEvent: (event: ApiEvent) => {
        set({ currentEvent: event });
        // Notify all subscribers
        get().subscribers.forEach(callback => callback(event));
    },
    subscribe: (callback: (event: ApiEvent | null) => void) => {
        set(state => ({
          subscribers: [...state.subscribers, callback]
        }));
        
        // Return unsubscribe function
        return () => {
          set(state => ({
            subscribers: state.subscribers.filter(cb => cb !== callback)
          }));
        };
    }
}));
