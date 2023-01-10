import { LocalParticipant, Participant, RemoteParticipant, TrackPublication } from 'livekit-client';
import type { ClassNames } from '@livekit/components-styles/dist/types/general/styles.css';
import type { UnprefixedClassNames } from '@livekit/components-styles/dist/types_unprefixed/styles.scss';
import { cssPrefix } from './constants';
import { PinContextState, TrackParticipantPair } from './types';
export function kebabize(str: string) {
  return str.replace(/[A-Z]+(?![a-z])|[A-Z]/g, ($, ofs) => (ofs ? '-' : '') + $.toLowerCase());
}
/**
 * Converts a non prefixed CSS class into a prefixed one.
 */
export function lkClassName(unprefixedClassName: UnprefixedClassNames): ClassNames {
  return `${cssPrefix}-${unprefixedClassName}`;
}

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
 * Check if the participant track is pinned.
 */
export function isParticipantTrackPinned(
  trackParticipantPair: TrackParticipantPair,
  pinState: PinContextState | undefined,
): boolean {
  if (pinState === undefined) {
    return false;
  }

  const { track, participant } = trackParticipantPair;

  return pinState.some(
    ({ track: pinnedTrack, participant: pinnedParticipant }) =>
      pinnedTrack.trackSid === track.trackSid &&
      pinnedParticipant.identity === participant.identity,
  );
}

/**
 * Default sort for participants, it'll order participants by:
 * 1. dominant speaker (speaker with the loudest audio level)
 * 2. local participant
 * 3. other speakers that are recently active
 * 4. participants with video on
 * 5. by joinedAt
 */
export function sortParticipantsByVolume(participants: Participant[]): Participant[] {
  const sortedParticipants = [...participants];
  sortedParticipants.sort((a, b) => {
    // loudest speaker first
    if (a.isSpeaking && b.isSpeaking) {
      return b.audioLevel - a.audioLevel;
    }

    // speaker goes first
    if (a.isSpeaking !== b.isSpeaking) {
      if (a.isSpeaking) {
        return -1;
      } else {
        return 1;
      }
    }

    // last active speaker first
    if (a.lastSpokeAt !== b.lastSpokeAt) {
      const aLast = a.lastSpokeAt?.getTime() ?? 0;
      const bLast = b.lastSpokeAt?.getTime() ?? 0;
      return bLast - aLast;
    }

    // video on
    const aVideo = a.videoTracks.size > 0;
    const bVideo = b.videoTracks.size > 0;
    if (aVideo !== bVideo) {
      if (aVideo) {
        return -1;
      } else {
        return 1;
      }
    }

    // joinedAt
    return (a.joinedAt?.getTime() ?? 0) - (b.joinedAt?.getTime() ?? 0);
  });
  const localParticipant = sortedParticipants.find((p) => p instanceof LocalParticipant);
  if (localParticipant) {
    const localIdx = sortedParticipants.indexOf(localParticipant);
    if (localIdx >= 0) {
      sortedParticipants.splice(localIdx, 1);
      if (sortedParticipants.length > 0) {
        sortedParticipants.splice(1, 0, localParticipant);
      } else {
        sortedParticipants.push(localParticipant);
      }
    }
  }
  return sortedParticipants;
}
