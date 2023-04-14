import type { VideoSource, AudioSource } from '@livekit/components-core';
import { trackReference } from '@livekit/components-core';
import type { Participant } from 'livekit-client';
import type { UseMediaTrackOptions } from './useMediaTrackBySourceOrName';
import { useMediaTrackBySourceOrName } from './useMediaTrackBySourceOrName';
import { useEnsureTrackReference } from '../context';

export function useMediaTrack(
  source: VideoSource | AudioSource,
  participant?: Participant,
  options: UseMediaTrackOptions = {},
) {
  const maybeTrackRef = participant ? trackReference(participant, source) : undefined;
  const trackRef = useEnsureTrackReference(maybeTrackRef);
  return useMediaTrackBySourceOrName({ source, participant: trackRef.participant }, options);
}
