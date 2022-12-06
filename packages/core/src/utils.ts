import {
  LocalParticipant,
  Participant,
  RemoteParticipant,
  Track,
  TrackPublication,
} from 'livekit-client';
import type { ClassNames } from '@livekit/components-styles/dist/types/general/styles.css';
import type { UnprefixedClassNames } from '@livekit/components-styles/dist/types_unprefixed/styles.scss';
import { cssPrefix } from './constants';
export const kebabize = (str: string) =>
  str.replace(/[A-Z]+(?![a-z])|[A-Z]/g, ($, ofs) => (ofs ? '-' : '') + $.toLowerCase());

/**
 * Converts a non prefixed CSS class into a prefixed one.
 */
export function lkClassName(unprefixedClassName: UnprefixedClassNames): ClassNames {
  return `${cssPrefix}-${unprefixedClassName}`;
}

export const isLocal = (p: Participant) => p instanceof LocalParticipant;

export const isRemote = (p: Participant) => p instanceof RemoteParticipant;

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

export type FocusState = {
  participantInFocus?: Participant;
  trackInFocus?: Track.Source;
};

export function isParticipantTrackPinned(
  participant: Participant,
  focusState: FocusState | undefined,
  source: Track.Source,
): boolean {
  if (focusState === undefined) {
    console.warn(`focusState not set: `, focusState);
    return false;
  }

  if (focusState.participantInFocus === undefined || focusState.trackInFocus === undefined) {
    console.warn(`focusState not set: `, focusState);
    return false;
  }

  if (focusState.trackInFocus !== source) {
    return false;
  }

  if (focusState.participantInFocus.identity === participant.identity) {
    console.log(`Participant has same identity as pinned.`, focusState);
    switch (focusState.trackInFocus) {
      case Track.Source.Camera:
        return participant.isCameraEnabled;
        break;
      case Track.Source.ScreenShare:
        return participant.isScreenShareEnabled;
        break;

      default:
        return false;
        break;
    }
  } else {
    return false;
  }
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
