import type { Participant } from 'livekit-client';
import { useEnsureParticipant } from '../context';
import type { UseMediaTrackOptions } from './useMediaTrack';
import { useMediaTrackBySourceOrName } from './useMediaTrackBySourceOrName';

/**
 * @public
 * @deprecated This function will be removed in a future version, use `useTrackByName` instead.
 */
export function useMediaTrackByName(
  name: string,
  participant?: Participant,
  options: UseMediaTrackOptions = {},
) {
  const p = useEnsureParticipant(participant);
  return useMediaTrackBySourceOrName({ name, participant: p }, options);
}
