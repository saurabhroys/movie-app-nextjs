import { useEffect } from 'react';

export interface WindowListenerOptions {
  /** Called on any scroll event. No event argument needed. */
  onScroll?: () => void;
  /** Called on popstate events. Receives the PopStateEvent. */
  onPopState?: (event: PopStateEvent) => void;
}

/**
 * A hook that consolidates window event listeners for scroll and popstate events.
 * This reduces boilerplate in components that need both listeners.
 */
export function useWindowListeners({ onScroll, onPopState }: WindowListenerOptions) {
  useEffect(() => {
    if (!onScroll) return;
    const handler = () => onScroll?.();
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, [onScroll]);

  useEffect(() => {
    if (!onPopState) return;
    const handler = (e: PopStateEvent) => onPopState(e);
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [onPopState]);
}