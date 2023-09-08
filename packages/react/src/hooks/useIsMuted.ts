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

/** @public */
export function useIsMuted(trackRef: TrackReferenceOrPlaceholder): boolean;
/** @public @deprecated This overload will be removed in a future version, pass in trackRef instead. */
export function useIsMuted(source: Track.Source, options?: UseIsMutedOptions): boolean;
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
    !!(ref.publication?.isMuted || p.getTrack(ref.source)?.isMuted),
  );

  React.useEffect(() => {
    const listener = mutedObserver(ref).subscribe(setIsMuted);
    return () => listener.unsubscribe();
  }, [getTrackReferenceId(ref)]);

  return isMuted;
}
