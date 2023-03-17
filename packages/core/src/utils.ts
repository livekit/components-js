import {
  LocalParticipant,
  Participant,
  RemoteParticipant,
  Track,
  TrackPublication,
} from 'livekit-client';
import {
  isTrackReference,
  isTrackReferencePlaceholder,
  TrackReferenceWithPlaceholder,
} from './track-reference';
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
 * Check if the `TrackReference` is pinned.
 */
export function isTrackReferencePinned(
  trackBundle: TrackReferenceWithPlaceholder,
  pinState: PinState | undefined,
): boolean {
  if (pinState === undefined) {
    return false;
  }
  if (isTrackReference(trackBundle)) {
    return pinState.some(
      (pinnedTrackReference) =>
        pinnedTrackReference.participant.identity === trackBundle.participant.identity &&
        pinnedTrackReference.publication.trackSid === trackBundle.publication.trackSid,
    );
  } else if (isTrackReferencePlaceholder(trackBundle)) {
    return pinState.some(
      (pinnedTrackReference) =>
        pinnedTrackReference.participant.identity === trackBundle.participant.identity &&
        isTrackReferencePlaceholder(pinnedTrackReference) &&
        pinnedTrackReference.source === trackBundle.source,
    );
  } else {
    return false;
  }
}

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
