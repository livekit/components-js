import type { VideoSource, AudioSource } from '@livekit/components-core';
import type { Participant } from 'livekit-client';
import { useEnsureParticipant } from '../context/participant-context';
import { useMediaTrackBySourceOrName } from './useMediaTrackBySourceOrName';

/** @public */
export interface UseMediaTrackOptions {
  element?: React.RefObject<HTMLMediaElement>;
  props?: React.HTMLAttributes<HTMLVideoElement | HTMLAudioElement>;
}

/** @public */
export function useMediaTrack(
  source: VideoSource | AudioSource,
  participant?: Participant,
  options: UseMediaTrackOptions = {},
) {
  const p = useEnsureParticipant(participant);
  return useMediaTrackBySourceOrName({ source, participant: p }, options);
}
