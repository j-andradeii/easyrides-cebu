/**
 * Event Store Pattern (Pub-Sub)
 *
 * Used for broadcasting API events and cross-component communication
 * Components can subscribe to specific event types
 */

import { create } from 'zustand';

export type EventType = 'API_SUCCESS' | 'API_ERROR' | 'NOTIFICATION' | 'CUSTOM';
export type EventStatus = 'success' | 'error' | 'info' | 'warning';

export interface AppEvent {
  id: string;
  type: EventType;
  status: EventStatus;
  message: string;
  metadata?: Record<string, unknown>;
  timestamp: number;
}

interface EventState {
  events: AppEvent[];
  subscribers: Map<EventType, Set<(event: AppEvent) => void>>;

  // Actions
  emit: (event: Omit<AppEvent, 'id' | 'timestamp'>) => void;
  subscribe: (type: EventType, callback: (event: AppEvent) => void) => () => void;
  clearEvents: () => void;
  removeEvent: (id: string) => void;
}

export const useEventStore = create<EventState>((set, get) => ({
  events: [],
  subscribers: new Map(),

  emit: (event) => {
    const newEvent: AppEvent = {
      ...event,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    set((state) => ({
      events: [...state.events, newEvent],
    }));

    // Notify subscribers
    const subscribers = get().subscribers.get(event.type);
    if (subscribers) {
      subscribers.forEach((callback) => callback(newEvent));
    }
  },

  subscribe: (type, callback) => {
    const subscribers = get().subscribers;
    const typeSubscribers = subscribers.get(type) || new Set();
    typeSubscribers.add(callback);
    subscribers.set(type, typeSubscribers);

    // Return unsubscribe function
    return () => {
      const currentSubscribers = get().subscribers.get(type);
      if (currentSubscribers) {
        currentSubscribers.delete(callback);
      }
    };
  },

  clearEvents: () => set({ events: [] }),

  removeEvent: (id) =>
    set((state) => ({
      events: state.events.filter((event) => event.id !== id),
    })),
}));
