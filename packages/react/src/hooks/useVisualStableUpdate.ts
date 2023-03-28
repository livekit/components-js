import {
  log,
  sortTrackReferences,
  TrackReferenceOrPlaceholder,
  updatePages,
} from '@livekit/components-core';
import * as React from 'react';

interface UseVisualStableUpdateOptions {
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
 */
export function useVisualStableUpdate(
  /** `TrackReference`s to display in the grid.  */
  trackReferences: TrackReferenceOrPlaceholder[],
  maxItemsOnPage: number,
  options: UseVisualStableUpdateOptions = {},
): TrackReferenceOrPlaceholder[] {
  const stateTrackReferences = React.useRef<TrackReferenceOrPlaceholder[]>([]);
  const maxTilesOnPage = React.useRef<number>(-1);

  const nextSortedTrackReferences =
    typeof options.customSortFunction === 'function'
      ? options.customSortFunction(trackReferences)
      : sortTrackReferences(trackReferences);

  let updatedTrackReferences: TrackReferenceOrPlaceholder[] = nextSortedTrackReferences;
  if (maxItemsOnPage === maxTilesOnPage.current) {
    try {
      updatedTrackReferences = updatePages(
        stateTrackReferences.current,
        nextSortedTrackReferences,
        maxItemsOnPage,
      );
    } catch (error) {
      log.error('Error while running updatePages(): ', error);
    }
  }

  maxItemsOnPage !== maxTilesOnPage.current
    ? nextSortedTrackReferences
    : // Save info for next render to update with minimal visual change.
      (stateTrackReferences.current = trackReferences);
  maxTilesOnPage.current = maxItemsOnPage;

  return updatedTrackReferences;
}
