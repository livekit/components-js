import type * as React from 'react';
import type { Participant, Track } from 'livekit-client';
import { useTrackRefBySourceOrName } from './useTrackRefBySourceOrName';
import { useEnsureParticipant } from '../context';

/** @public */
export interface UseTrackOptions {
  element?: React.RefObject<HTMLMediaElement>;
  props?: React.HTMLAttributes<HTMLVideoElement | HTMLAudioElement>;
}

/** @public */
export function useTrack(source: Track.Source, participant?: Participant) {
  const p = useEnsureParticipant(participant);
  return useTrackRefBySourceOrName({ source, participant: p });
}
