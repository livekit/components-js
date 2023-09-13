import type { TrackReferenceOrPlaceholder } from '@livekit/components-core';
import { log, sortTrackReferences, updatePages } from '@livekit/components-core';
import * as React from 'react';

/** @public */
export interface UseVisualStableUpdateOptions {
  /** Overwrites the default sort function. */
  customSortFunction?: (
    trackReferences: TrackReferenceOrPlaceholder[],
  ) => TrackReferenceOrPlaceholder[];
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
export function useVisualStableUpdate(
  /** `TrackReference`s to display in the grid.  */
  trackReferences: TrackReferenceOrPlaceholder[],
  maxItemsOnPage: number,
  options: UseVisualStableUpdateOptions = {},
): TrackReferenceOrPlaceholder[] {
  const lastTrackRefs = React.useRef<TrackReferenceOrPlaceholder[]>([]);
  const lastMaxItemsOnPage = React.useRef<number>(-1);
  const layoutChanged = maxItemsOnPage !== lastMaxItemsOnPage.current;

  const sortedTrackRefs =
    typeof options.customSortFunction === 'function'
      ? options.customSortFunction(trackReferences)
      : sortTrackReferences(trackReferences);

  let updatedTrackRefs: TrackReferenceOrPlaceholder[] = [...sortedTrackRefs];
  if (layoutChanged === false) {
    try {
      updatedTrackRefs = updatePages(lastTrackRefs.current, sortedTrackRefs, maxItemsOnPage);
    } catch (error) {
      log.error('Error while running updatePages(): ', error);
    }
  }

  // Save info for to compare against in the next update cycle.
  if (layoutChanged) {
    lastTrackRefs.current = sortedTrackRefs;
  } else {
    lastTrackRefs.current = updatedTrackRefs;
  }
  lastMaxItemsOnPage.current = maxItemsOnPage;

  return updatedTrackRefs;
}
