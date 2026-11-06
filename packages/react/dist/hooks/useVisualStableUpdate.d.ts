import { TrackReferenceOrPlaceholder } from '@livekit/components-core';
/** @public */
export interface UseVisualStableUpdateOptions {
    /** Overwrites the default sort function. */
    customSortFunction?: (trackReferences: TrackReferenceOrPlaceholder[]) => TrackReferenceOrPlaceholder[];
}
/**
 * The `useVisualStableUpdate` hook is used to prevent visually jarring jumps and shifts of elements
 * in an array. The algorithm only starts to update when there are more items than visually fit
 * on a page. If this is the case, it will make sure that speaking participants move to the first
 * page and are always visible.
 * @remarks
 * Updating the array can occur because attendees leave or join a room, or because they mute/unmute
 * or start speaking.
 * The hook is used for the `GridLayout` and `CarouselLayout` components.
 *
 * @example
 * ```tsx
 * const trackRefs = useTracks();
 * const updatedTrackRefs = useVisualStableUpdate(trackRefs, itemPerPage);
 * ```
 * @public
 */
export declare function useVisualStableUpdate(
/** `TrackReference`s to display in the grid.  */
trackReferences: TrackReferenceOrPlaceholder[], maxItemsOnPage: number, options?: UseVisualStableUpdateOptions): TrackReferenceOrPlaceholder[];
//# sourceMappingURL=useVisualStableUpdate.d.ts.map