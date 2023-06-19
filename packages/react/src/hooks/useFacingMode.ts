import type { TrackReferenceOrPlaceholder } from '@livekit/components-core';

/**
 * Try to determine the `facingMode` of a local participant track.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints/facingMode | MDN docs on facingMode}
 * @alpha
 */
export function useFacingMode(
  trackReference: TrackReferenceOrPlaceholder,
): 'user' | 'environment' | 'undefined' {
  if (trackReference.participant.isLocal) {
    //TODO: use client-sdk-js function to get facingMode.
    return 'user';
  } else {
    return 'undefined';
  }
}
