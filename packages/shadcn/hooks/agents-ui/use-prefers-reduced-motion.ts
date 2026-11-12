import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

// Created once per `matchMedia` and reused, since the visualizers read it on every animation frame
let cachedMatchMedia: typeof window.matchMedia | undefined;
let cachedQuery: MediaQueryList | null = null;

function getMediaQuery() {
  if (typeof window === 'undefined' || !window.matchMedia) return null;
  if (cachedMatchMedia !== window.matchMedia) {
    cachedMatchMedia = window.matchMedia;
    cachedQuery = window.matchMedia(QUERY);
  }
  return cachedQuery;
}

function subscribe(onChange: () => void) {
  const query = getMediaQuery();
  query?.addEventListener('change', onChange);
  return () => query?.removeEventListener('change', onChange);
}

function getSnapshot() {
  return getMediaQuery()?.matches ?? false;
}

function getServerSnapshot() {
  return false;
}

/**
 * Whether the user asked the system to reduce motion. Updates when the setting changes, and is
 * `false` on the server.
 */
export function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
