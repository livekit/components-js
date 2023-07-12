import type { TrackReferenceOrPlaceholder } from '@livekit/components-core';
import { facingModeFromLocalTrack } from 'livekit-client';
import type { LocalTrack } from 'livekit-client';

/**
 * Try to determine the `facingMode` of a local participant video track.
 * @remarks
 * Works only on local video tracks.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints/facingMode | MDN docs on facingMode}
 * @alpha
 */
export function useFacingMode(
  trackReference: TrackReferenceOrPlaceholder,
): 'user' | 'environment' | 'left' | 'right' | 'undefined' {
  if (!trackReference.participant.isLocal) {
    return 'undefined';
  }

  let mediaStreamTrack: LocalTrack | undefined;
  if (trackReference.publication === undefined) {
    if (trackReference.participant.videoTracks.size > 0) {
      mediaStreamTrack = Array.from(trackReference.participant.videoTracks.values())[0]
        .videoTrack as LocalTrack;
    }
  } else {
    mediaStreamTrack = trackReference.publication.track as LocalTrack;
  }

  if (mediaStreamTrack) {
    const { facingMode } = facingModeFromLocalTrack(mediaStreamTrack as LocalTrack);
    return facingMode;
  } else {
    return 'undefined';
  }
}
