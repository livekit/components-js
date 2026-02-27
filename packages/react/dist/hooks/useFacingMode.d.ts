import { TrackReferenceOrPlaceholder } from '@livekit/components-core';
/**
 * Try to determine the `facingMode` of a local participant video track.
 * @remarks
 * Works only on local video tracks.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints/facingMode | MDN docs on facingMode}
 * @alpha
 */
export declare function useFacingMode(trackReference: TrackReferenceOrPlaceholder): 'user' | 'environment' | 'left' | 'right' | 'undefined';
//# sourceMappingURL=useFacingMode.d.ts.map