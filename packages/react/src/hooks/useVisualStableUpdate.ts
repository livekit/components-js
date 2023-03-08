import {
  log,
  sortTrackBundles,
  TrackBundleWithPlaceholder,
  updatePages,
} from '@livekit/components-core';
import * as React from 'react';

interface UseVisualStableUpdateOptions {
  /** Overwrites the default sort function. */
  customSortFunction?: (trackBundles: TrackBundleWithPlaceholder[]) => TrackBundleWithPlaceholder[];
}

/**
 * The useVisualStableUpdate hook tries to keep visual updates of the TackBundles array to a minimum,
 * while still trying to display important tiles such as speaking participants or screen shares.
 *
 * Updating works with pagination. For example, if a participant starts speaking on the second page,
 * they will be moved to the first page by replacing the least active/interesting participant on the first page.
 */
export function useVisualStableUpdate(
  /** `TrackBundle`s to display in the grid.  */
  trackBundles: TrackBundleWithPlaceholder[],
  maxItemsOnPage: number,
  options: UseVisualStableUpdateOptions = {},
): TrackBundleWithPlaceholder[] {
  const stateTrackBundles = React.useRef<TrackBundleWithPlaceholder[]>([]);
  const maxTilesOnPage = React.useRef<number>(-1);

  const nextSortedTrackBundles =
    typeof options.customSortFunction === 'function'
      ? options.customSortFunction(trackBundles)
      : sortTrackBundles(trackBundles);

  let updatedTrackBundles: TrackBundleWithPlaceholder[] = nextSortedTrackBundles;
  if (maxItemsOnPage === maxTilesOnPage.current) {
    try {
      updatedTrackBundles = updatePages(
        stateTrackBundles.current,
        nextSortedTrackBundles,
        maxItemsOnPage,
      );
    } catch (error) {
      log.error('Error while running updatePages(): ', error);
    }
  }

  maxItemsOnPage !== maxTilesOnPage.current
    ? nextSortedTrackBundles
    : // Save info for next render to update with minimal visual change.
      (stateTrackBundles.current = trackBundles);
  maxTilesOnPage.current = maxItemsOnPage;

  return updatedTrackBundles;
}
