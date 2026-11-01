'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void) {
  const media = window.matchMedia?.(QUERY);
  media?.addEventListener('change', onChange);
  return () => media?.removeEventListener('change', onChange);
}

function getSnapshot() {
  return window.matchMedia?.(QUERY).matches ?? false;
}

// Render without animation until the browser preference is available on hydration.
const getServerSnapshot = () => true;

export function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Controls visualization only; it never pauses a track or agent session.
 * Defaults to paused for reduced motion. A system-preference change resets the
 * user's playback choice to that preference. Choices are local to this hook.
 */
export function useAgentAudioVisualizerMotion() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [choice, setChoice] = useState<{ preference: boolean; paused: boolean } | null>(null);

  useEffect(() => setChoice(null), [prefersReducedMotion]);

  const setPaused = useCallback(
    (paused: boolean) => setChoice({ preference: prefersReducedMotion, paused }),
    [prefersReducedMotion],
  );

  return {
    prefersReducedMotion,
    paused: choice?.preference === prefersReducedMotion ? choice.paused : prefersReducedMotion,
    setPaused,
  };
}
