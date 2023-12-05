import type { Participant } from 'livekit-client';
import { useEnsureParticipant } from '../context';
import { useTrackRefBySourceOrName } from './useTrackRefBySourceOrName';

/**
 * @public
 */
export function useTrackByName(name: string, participant?: Participant) {
  const p = useEnsureParticipant(participant);
  return useTrackRefBySourceOrName({ name, participant: p });
}
