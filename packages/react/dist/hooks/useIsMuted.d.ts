import { TrackReferenceOrPlaceholder } from '@livekit/components-core';
import { Participant } from 'livekit-client';
/** @public */
export interface UseIsMutedOptions {
    participant?: Participant;
}
/**
 * The `useIsMuted` hook is used to implement the `TrackMutedIndicator` or your custom implementation of it.
 * It returns a `boolean` that indicates if the track is muted or not.
 *
 * @example With a track reference
 * ```tsx
 * const isMuted = useIsMuted(track);
 * ```
 *
 * @example With a track source / participant
 * ```tsx
 * const isMuted = useIsMuted('camera', { participant });
 * ```
 *
 * @param sourceOrTrackRef - Either a `TrackReference` or a `Track.Source` (see usage examples)
 * @param options - Additional options when using a `Track.Source`
 * @returns boolean indicating if the track is muted
 *
 * @public
 */
export declare function useIsMuted(trackRef: TrackReferenceOrPlaceholder): boolean;
//# sourceMappingURL=useIsMuted.d.ts.map