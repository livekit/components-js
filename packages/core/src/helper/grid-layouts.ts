import { log } from '../logger';

export type GridLayoutDefinition = {
  /** Layout name (convention `<column_count>x<row_count>`). */
  name: string;
  /** Column count of the layout. */
  columns: number;
  /** Row count of the layout. */
  rows: number;
  // # Constraints that have to be meet to use this layout.
  // ## 1. Participant range:
  /** Minimum number of tiles needed to use this layout. */
  minTiles: number;
  /** Maximum tiles that fit into this layout. */
  maxTiles: number;
  // ## 2. Screen size limits:
  /** Minimum width required to use this layout. */
  minWidth: number;
  /** Minimum height required to use this layout. */
  minHeight: number;
};

export const GRID_LAYOUTS: GridLayoutDefinition[] = [
  {
    columns: 1,
    rows: 1,
    name: '1x1',
    minTiles: 1,
    maxTiles: 1,
    minWidth: 0,
    minHeight: 0,
  },
  {
    columns: 1,
    rows: 2,
    name: '1x2',
    minTiles: 2,
    maxTiles: 2,
    minWidth: 0,
    minHeight: 0,
  },
  {
    columns: 2,
    rows: 1,
    name: '2x1',
    minTiles: 2,
    maxTiles: 2,
    minWidth: 900,
    minHeight: 0,
  },
  {
    columns: 2,
    rows: 2,
    name: '2x2',
    minTiles: 3,
    maxTiles: 4,
    minWidth: 560,
    minHeight: 0,
  },
  {
    columns: 3,
    rows: 3,
    name: '3x3',
    minTiles: 5,
    maxTiles: 9,
    minWidth: 700,
    minHeight: 0,
  },
  {
    columns: 4,
    rows: 4,
    name: '4x4',
    minTiles: 10,
    maxTiles: 16,
    minWidth: 960,
    minHeight: 0,
  },
  {
    columns: 5,
    rows: 5,
    name: '5x5',
    minTiles: 17,
    maxTiles: 25,
    minWidth: 1100,
    minHeight: 0,
  },
];

export function selectGridLayout(
  layouts: GridLayoutDefinition[],
  participantCount: number,
  width: number,
  height: number,
): GridLayoutDefinition {
  // Find the best layout to fit all participants.
  let currentLayoutIndex = 0;
  let layout = layouts.find((layout_, index, allLayouts) => {
    currentLayoutIndex = index;
    const isBiggerLayoutAvailable =
      allLayouts.findIndex((l, i) => {
        const layoutIsBiggerThanCurrent = i > index;
        const layoutFitsSameAmountOfParticipants = l.maxTiles === layout_.maxTiles;
        return layoutIsBiggerThanCurrent && layoutFitsSameAmountOfParticipants;
      }) !== -1;
    return layout_.maxTiles >= participantCount && !isBiggerLayoutAvailable;
  });
  if (layout === undefined) {
    layout = layouts[layouts.length - 1];
    if (layout) {
      log.warn(
        `No layout found for: participantCount: ${participantCount}, width/height: ${width}/${height} fallback to biggest available layout (${layout.name}).`,
      );
    } else {
      throw new Error(`No layout or fallback layout found.`);
    }
  }

  // Check if the layout fits into the screen constraints. If not, recursively check the next smaller layout.
  if (width < layout.minWidth || height < layout.minHeight) {
    // const currentLayoutIndex = layouts.indexOf(layout);
    if (currentLayoutIndex > 0) {
      const smallerLayout = layouts[currentLayoutIndex - 1];
      layout = selectGridLayout(
        layouts.slice(0, currentLayoutIndex),
        smallerLayout.maxTiles,
        width,
        height,
      );
    }
  }
  return layout;
}
