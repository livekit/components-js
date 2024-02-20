import type { Participant, Track } from 'livekit-client';
import { useTrackRefBySourceOrName } from './useTrackRefBySourceOrName';
import { useEnsureParticipant } from '../context';

/**
 * TODO decide whether we want to expose this
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useTrack(source: Track.Source, participant?: Participant) {
  const p = useEnsureParticipant(participant);
  return useTrackRefBySourceOrName({ source, participant: p });
}
