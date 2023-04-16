import type { Participant } from 'livekit-client';
import { Track } from 'livekit-client';
import { useEnsureTrackReference } from '../context';
import type { UseMediaTrackOptions } from './useMediaTrackBySourceOrName';
import { useMediaTrackBySourceOrName } from './useMediaTrackBySourceOrName';
import { trackReference } from '@livekit/components-core';

export function useMediaTrackByName(
  name: string,
  participant?: Participant,
  options: UseMediaTrackOptions = {},
) {
  const maybeTrackRef = participant ? trackReference(participant, Track.Source.Unknown) : undefined;
  const trackRef = useEnsureTrackReference(maybeTrackRef);
  return useMediaTrackBySourceOrName({ name, participant: trackRef.participant }, options);
}
