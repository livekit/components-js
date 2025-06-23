import { setupConnectionQualityIndicator } from '@livekit/components-core';
import type { Participant } from 'livekit-client';
import * as React from 'react';
import { useEnsureParticipant } from '../context';
import { useObservableState } from './internal';

/** @public */
export interface ConnectionQualityIndicatorOptions {
  participant?: Participant;
}

/**
 * The `useConnectionQualityIndicator` hook provides props for the `ConnectionQualityIndicator` or your custom implementation of it component.
 * @example
 * ```tsx
 * const { quality } = useConnectionQualityIndicator();
 * // or
 * const { quality } = useConnectionQualityIndicator({ participant });
 * ```
 * @public
 */
export function useConnectionQualityIndicator(options: ConnectionQualityIndicatorOptions = {}) {
  const p = useEnsureParticipant(options.participant);

  const { className, connectionQualityObserver } = React.useMemo(
    () => setupConnectionQualityIndicator(p),
    [p],
  );

  const quality = useObservableState(connectionQualityObserver, p.connectionQuality);

  return { className, quality };
}
