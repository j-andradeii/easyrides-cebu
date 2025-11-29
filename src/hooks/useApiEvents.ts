/**
 * useApiEvents Hook
 *
 * Subscribe to API events from the event store
 * Example of using the pub-sub pattern for cross-component communication
 */

'use client';

import { useEffect } from 'react';
import { useEventStore, EventType, AppEvent } from '@/stores/event.store';

/**
 * Hook to subscribe to specific API event types
 */
export function useApiEvents(
  eventType: EventType,
  callback: (event: AppEvent) => void
) {
  const subscribe = useEventStore((state) => state.subscribe);

  useEffect(() => {
    // Subscribe to the event type
    const unsubscribe = subscribe(eventType, callback);

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [eventType, callback, subscribe]);
}

/**
 * Hook to get all events from the store
 */
export function useEvents() {
  return useEventStore((state) => state.events);
}

/**
 * Hook to get event actions
 */
export function useEventActions() {
  return {
    emit: useEventStore((state) => state.emit),
    clearEvents: useEventStore((state) => state.clearEvents),
    removeEvent: useEventStore((state) => state.removeEvent),
  };
}
