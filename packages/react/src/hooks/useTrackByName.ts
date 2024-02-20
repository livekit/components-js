import type { Participant } from 'livekit-client';
import { useEnsureParticipant } from '../context';
import { useTrackRefBySourceOrName } from './useTrackRefBySourceOrName';

/**
 * This function `useTrackByName` allows you to access a track by referencing its track name.
 * Inside the function, it ensures that the a valid `participant` reference is available by checking
 * for both a passed participant argument and, if not available, a valid participant context.
 *
 * @public
 */
export function useTrackByName(name: string, participant?: Participant) {
  const p = useEnsureParticipant(participant);
  return useTrackRefBySourceOrName({ name, participant: p });
}
