import {
  LocalParticipant,
  Participant,
  RemoteParticipant,
  Track,
  TrackPublication,
} from 'livekit-client';

import { PinState } from './types';

export function isLocal(p: Participant) {
  return p instanceof LocalParticipant;
}

export function isRemote(p: Participant) {
  return p instanceof RemoteParticipant;
}

export const attachIfSubscribed = (
  publication: TrackPublication | undefined,
  element: HTMLMediaElement | null | undefined,
) => {
  if (!publication) return;
  const { isSubscribed, track } = publication;
  if (element && track) {
    if (isSubscribed) {
      track.attach(element);
    } else {
      track.detach(element);
    }
  }
};

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
    ({ publication: pinnedTrack, participant: pinnedParticipant }) =>
      pinnedTrack.source === source && pinnedParticipant.identity === participant.identity,
  );
}
