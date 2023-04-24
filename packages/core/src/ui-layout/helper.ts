import type { Participant, Track } from 'livekit-client';
import type { PinState } from './layout';

/**
 * Check if the participant track source is pinned.
 */
export function isParticipantSourcePinned(
  participant: Participant,
  source: Track.Source,
  pinState: PinState | undefined,
): boolean {
  if (pinState === undefined) {
    return false;
  }

  return pinState.some(
    ({ source: pinnedSource, participant: pinnedParticipant }) =>
      pinnedSource === source && pinnedParticipant.identity === participant.identity,
  );
}
