import { VideoSource, AudioSource } from '@livekit/components-core';
import { Participant } from 'livekit-client';
import { useEnsureParticipant } from '../context/participant-context';
import { UseMediaTrackOptions, useMediaTrackBySourceOrName } from './useMediaTrackBySourceOrName';

export function useMediaTrack(
  source: VideoSource | AudioSource,
  participant?: Participant,
  options: UseMediaTrackOptions = {},
) {
  const p = useEnsureParticipant(participant);
  return useMediaTrackBySourceOrName({ source, participant: p }, options);
}
