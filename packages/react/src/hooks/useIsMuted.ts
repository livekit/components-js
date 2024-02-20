import {
  type TrackReferenceOrPlaceholder,
  getTrackReferenceId,
  mutedObserver,
} from '@livekit/components-core';
import type { Participant, Track } from 'livekit-client';
import * as React from 'react';
import { useEnsureParticipant } from '../context';

/** @public */
export interface UseIsMutedOptions {
  participant?: Participant;
}

/**
 * The `useIsMuted` hook is used to implement the `TrackMutedIndicator` or your custom implementation of it.
 * It returns a `boolean` that indicates if the track is muted or not.
 *
 * @example
 * ```tsx
 * const isMuted = useIsMuted(track);
 * ```
 * @public
 */
export function useIsMuted(trackRef: TrackReferenceOrPlaceholder): boolean;
export function useIsMuted(
  sourceOrTrackRef: TrackReferenceOrPlaceholder | Track.Source,
  options: UseIsMutedOptions = {},
) {
  const passedParticipant =
    typeof sourceOrTrackRef === 'string' ? options.participant : sourceOrTrackRef.participant;
  const p = useEnsureParticipant(passedParticipant);
  const ref =
    typeof sourceOrTrackRef === 'string'
      ? { participant: p, source: sourceOrTrackRef }
      : sourceOrTrackRef;
  const [isMuted, setIsMuted] = React.useState(
    !!(ref.publication?.isMuted || p.getTrackPublication(ref.source)?.isMuted),
  );

  React.useEffect(() => {
    const listener = mutedObserver(ref).subscribe(setIsMuted);
    return () => listener.unsubscribe();
  }, [getTrackReferenceId(ref)]);

  return isMuted;
}
