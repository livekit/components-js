import type { Participant } from 'livekit-client';
import { useEnsureParticipant } from '../context';
import type { UseMediaTrackOptions } from './useMediaTrackBySourceOrName';
import { useMediaTrackBySourceOrName } from './useMediaTrackBySourceOrName';

export function useMediaTrackByName(
  name: string,
  participant?: Participant,
  options: UseMediaTrackOptions = {},
) {
  const p = useEnsureParticipant(participant);
  return useMediaTrackBySourceOrName({ name, participant: p }, options);
}
