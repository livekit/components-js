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
 * The useVisualStableUpdate hook tries to keep visual updates of the TackBundles array to a minimum,
 * while still trying to display important tiles such as speaking participants or screen shares.
 *
 * Updating works with pagination. For example, if a participant starts speaking on the second page,
 * they will be moved to the first page by replacing the least active/interesting participant on the first page.
 *
 * @beta
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
