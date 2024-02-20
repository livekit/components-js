import {
  type TrackReferenceOrPlaceholder,
  setupTrackMutedIndicator,
  getTrackReferenceId,
} from '@livekit/components-core';
import * as React from 'react';
import { useEnsureTrackRef } from '../context';
import { useObservableState } from './internal';

interface TrackMutedIndicatorReturnType {
  isMuted: boolean;
  className: string;
}

/**
 * The `useTrackMutedIndicator` hook is used to implement the `TrackMutedIndicator` component
 * and returns the muted state of the given track.
 *
 * @example
 * ```tsx
 * const { isMuted } = useTrackMutedIndicator(trackRef);
 * ```
 * @public
 */
export function useTrackMutedIndicator(
  trackRef?: TrackReferenceOrPlaceholder,
): TrackMutedIndicatorReturnType {
  const trackReference = useEnsureTrackRef(trackRef);

  const { className, mediaMutedObserver } = React.useMemo(
    () => setupTrackMutedIndicator(trackReference),
    [getTrackReferenceId(trackReference)],
  );

  const isMuted = useObservableState(
    mediaMutedObserver,
    !!(
      trackReference.publication?.isMuted ||
      trackReference.participant.getTrackPublication(trackReference.source)?.isMuted
    ),
  );

  return { isMuted, className };
}
