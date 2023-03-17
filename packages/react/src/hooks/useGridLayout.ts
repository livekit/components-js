import {
  GRID_LAYOUTS,
  selectGridLayout,
  TrackBundleWithPlaceholder,
} from '@livekit/components-core';
import { GridLayout } from '@livekit/components-core/dist/helper/grid-layouts';
import * as React from 'react';
import { useSize } from './internal';
import { useVisualStableUpdate } from './useVisualStableUpdate';

/**
 * The useGridLayout hook tries to select the best layout to fit all tiles.
 * If the available screen space is not enough, it will reduce the number of maximum visible
 * tiles and select a layout that still works visually within the given limitations.
 * As the order of tiles changes over time, the hook tries to keep visual updates to a minimum
 * while trying to display important tiles such as speaking participants or screen shares.
 */
export function useGridLayout(
  /** HTML element that contains the grid. */
  gridElement: React.RefObject<HTMLDivElement>,
  /** `TrackBundle`s to display in the grid.  */
  trackBundles: TrackBundleWithPlaceholder[],
): { layout: GridLayout; trackBundles: TrackBundleWithPlaceholder[] } {
  const { width, height } = useSize(gridElement);

  const layout =
    width > 0 && height > 0
      ? selectGridLayout(GRID_LAYOUTS, trackBundles.length, width, height)
      : GRID_LAYOUTS[0];

  const updatedTrackBundles = useVisualStableUpdate(trackBundles, layout.maxParticipants);

  React.useEffect(() => {
    if (gridElement.current && layout) {
      gridElement.current.style.setProperty('--lk-col-count', layout?.columns.toString());
      gridElement.current.style.setProperty('--lk-row-count', layout?.rows.toString());
    }
  }, [gridElement, layout]);

  return {
    layout,
    trackBundles: updatedTrackBundles,
  };
}
