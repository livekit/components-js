import { TrackReferenceOrPlaceholder } from '@livekit/components-core';
interface TrackMutedIndicatorReturnType {
    isMuted: boolean;
    className: string;
}
/**
 * The `useTrackMutedIndicator` hook is used to implement the `TrackMutedIndicator` component
 * and returns the muted state of the given track.
 *
 * @example
 * ```tsx
 * const { isMuted } = useTrackMutedIndicator(trackRef);
 * ```
 * @public
 */
export declare function useTrackMutedIndicator(trackRef?: TrackReferenceOrPlaceholder): TrackMutedIndicatorReturnType;
export {};
//# sourceMappingURL=useTrackMutedIndicator.d.ts.map