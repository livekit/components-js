import { Participant } from 'livekit-client';
import { useEnsureParticipant } from '../context';
import { useMediaTrackBySourceOrName, UseMediaTrackOptions } from './useMediaTrackBySourceOrName';

export function useMediaTrackByName(
  name: string,
  participant?: Participant,
  options: UseMediaTrackOptions = {},
) {
  const p = useEnsureParticipant(participant);
  return useMediaTrackBySourceOrName({ name, participant: p }, options);
}
