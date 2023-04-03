import { Track } from 'livekit-client';
import type { TrackReferenceOrPlaceholder } from '../track-reference';
import { isTrackReference } from '../track-reference';
import {
  sortParticipantsByAudioLevel,
  sortParticipantsByIsSpeaking,
  sortParticipantsByJoinedAt,
  sortParticipantsByLastSpokenAT,
  sortTrackReferencesByType,
  sortTrackRefsByIsCameraEnabled,
} from './base-sort-functions';

/**
 * Default sort for `TrackReferenceOrPlaceholder`, it'll order participants by:
 * 1. local camera track (publication.isLocal)
 * 2. remote screen_share track
 * 3. local screen_share track
 * 4. remote dominant speaker camera track (sorted by speaker with the loudest audio level)
 * 5. other remote speakers that are recently active
 * 6. remote unmuted camera tracks
 * 7. remote tracks sorted by joinedAt
 */
export function sortTrackReferences(
  tracks: TrackReferenceOrPlaceholder[],
): TrackReferenceOrPlaceholder[] {
  const localTracks: TrackReferenceOrPlaceholder[] = [];
  const screenShareTracks: TrackReferenceOrPlaceholder[] = [];
  const cameraTracks: TrackReferenceOrPlaceholder[] = [];
  const undefinedTracks: TrackReferenceOrPlaceholder[] = [];

  tracks.forEach((trackRef) => {
    if (trackRef.participant.isLocal && trackRef.source === Track.Source.Camera) {
      localTracks.push(trackRef);
    } else if (trackRef.source === Track.Source.ScreenShare) {
      screenShareTracks.push(trackRef);
    } else if (trackRef.source === Track.Source.Camera) {
      cameraTracks.push(trackRef);
    } else {
      undefinedTracks.push(trackRef);
    }
  });

  const sortedScreenShareTracks = sortScreenShareTracks(screenShareTracks);
  const sortedCameraTracks = sortCameraTracks(cameraTracks);

  return [...localTracks, ...sortedScreenShareTracks, ...sortedCameraTracks, ...undefinedTracks];
}

/**
 * Sort an array of `TrackReference` screen shares.
 * Main sorting order:
 * 1. remote screen shares
 * 2. local screen shares
 * Secondary sorting by participant's joining time.
 */
function sortScreenShareTracks(
  screenShareTracks: TrackReferenceOrPlaceholder[],
): TrackReferenceOrPlaceholder[] {
  const localScreenShares: TrackReferenceOrPlaceholder[] = [];
  const remoteScreenShares: TrackReferenceOrPlaceholder[] = [];

  screenShareTracks.forEach((trackRef) => {
    if (trackRef.participant.isLocal) {
      localScreenShares.push(trackRef);
    } else {
      remoteScreenShares.push(trackRef);
    }
  });

  localScreenShares.sort((a, b) => sortParticipantsByJoinedAt(a.participant, b.participant));
  remoteScreenShares.sort((a, b) => sortParticipantsByJoinedAt(a.participant, b.participant));

  const sortedScreenShareTrackRefs = [...remoteScreenShares, ...localScreenShares];
  return sortedScreenShareTrackRefs;
}

function sortCameraTracks(
  cameraTrackReferences: TrackReferenceOrPlaceholder[],
): TrackReferenceOrPlaceholder[] {
  const localCameraTracks: TrackReferenceOrPlaceholder[] = [];
  const remoteCameraTracks: TrackReferenceOrPlaceholder[] = [];

  cameraTrackReferences.forEach((trackRef) => {
    if (trackRef.participant.isLocal) {
      localCameraTracks.push(trackRef);
    } else {
      remoteCameraTracks.push(trackRef);
    }
  });

  remoteCameraTracks.sort((a, b) => {
    // Participant with higher audio level goes first.
    if (a.participant.isSpeaking && b.participant.isSpeaking) {
      return sortParticipantsByAudioLevel(a.participant, b.participant);
    }

    // A speaking participant goes before one that is not speaking.
    if (a.participant.isSpeaking !== b.participant.isSpeaking) {
      return sortParticipantsByIsSpeaking(a.participant, b.participant);
    }

    // A participant that spoke recently goes before a participant that spoke a while back.
    if (a.participant.lastSpokeAt !== b.participant.lastSpokeAt) {
      return sortParticipantsByLastSpokenAT(a.participant, b.participant);
    }

    // TrackReference before TrackReferencePlaceholder
    if (isTrackReference(a) !== isTrackReference(b)) {
      return sortTrackReferencesByType(a, b);
    }

    // Tiles with video on before tiles with muted video track.
    if (a.participant.isCameraEnabled !== b.participant.isCameraEnabled) {
      return sortTrackRefsByIsCameraEnabled(a, b);
    }

    // A participant that joined a long time ago goes before one that joined recently.
    return sortParticipantsByJoinedAt(a.participant, b.participant);
  });

  return [...localCameraTracks, ...remoteCameraTracks];
}
