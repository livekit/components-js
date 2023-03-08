import {
  GRID_LAYOUTS,
  selectGridLayout,
  sortTrackBundles,
  TrackBundleWithPlaceholder,
  updatePages,
} from '@livekit/components-core';
import { GridLayout } from '@livekit/components-core/dist/helper/grid-layouts';
import * as React from 'react';
import { useSize } from '../helper';

/**
 * The useGridLayout hook tries to select the best layout to fit all tiles.
 * If the available screen space is not enough, it will reduce the number of maximum visible
 * tiles and select a layout that still works visually within the given limitations.
 * As the order of tiles changes over time, the hook tries to keep visual updates to a minimum
 * while trying to display important tiles such as speaking participants or screen shares.
 */
export function useGridLayout(
  /** HTML element that contains the gird. */
  containerElement: React.RefObject<HTMLDivElement>,
  /** Direct child of the `containerElement`. */
  gridElement: React.RefObject<HTMLDivElement>,
  /** `TrackBundle`s to display in the grid.  */
  trackBundles: TrackBundleWithPlaceholder[],
): { layout: GridLayout; trackBundles: TrackBundleWithPlaceholder[] } {
  const stateTrackBundles = React.useRef<TrackBundleWithPlaceholder[]>([]);
  const maxTilesOnPage = React.useRef<number>(-1);
  const { width, height } = useSize(containerElement);

  const layout =
    width > 0 && height > 0
      ? selectGridLayout(GRID_LAYOUTS, trackBundles.length, width, height)
      : GRID_LAYOUTS[0];

  const nextSortedTrackBundles = sortTrackBundles(trackBundles);
  const updatedTrackBundles =
    layout.maxParticipants !== maxTilesOnPage.current
      ? nextSortedTrackBundles
      : updatePages(stateTrackBundles.current, nextSortedTrackBundles, layout.maxParticipants);

  // Save info for next render to update with minimal visual change.
  stateTrackBundles.current = trackBundles;
  maxTilesOnPage.current = layout.maxParticipants;

  React.useEffect(() => {
    if (gridElement.current && layout) {
      gridElement.current.style.setProperty('--lk-col-count', layout?.columns.toString());
    }
  }, [gridElement, layout]);

  return {
    layout,
    trackBundles: updatedTrackBundles,
  };
}
