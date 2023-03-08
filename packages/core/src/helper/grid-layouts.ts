import log from '../logger';

export type GridLayout = {
  name: string;
  columns: number;
  rows: number;
  // # Constraints that have to be meet to use this layout.
  // ## 1. Participant range:
  /** Minimum number of participants needed to use this layout. */
  minParticipants: number;
  /** Maximum participants that fit into this layout. */
  maxParticipants: number;
  // ## 2. Screen size limits:
  /** Minimum width required to use this layout. */
  minWidth: number;
  /** Minimum height required to use this layout. */
  minHeight: number;
};

export const GRID_LAYOUTS: GridLayout[] = [
  {
    columns: 1,
    rows: 1,
    name: '1x1',
    minParticipants: 1,
    maxParticipants: 1,
    minWidth: 0,
    minHeight: 0,
  },
  {
    columns: 1,
    rows: 2,
    name: '1x2',
    minParticipants: 2,
    maxParticipants: 2,
    minWidth: 0,
    minHeight: 0,
  },
  {
    columns: 2,
    rows: 1,
    name: '2x1',
    minParticipants: 2,
    maxParticipants: 2,
    minWidth: 800,
    minHeight: 0,
  },
  {
    columns: 2,
    rows: 2,
    name: '2x2',
    minParticipants: 3,
    maxParticipants: 4,
    minWidth: 560,
    minHeight: 0,
  },
  {
    columns: 3,
    rows: 3,
    name: '3x3',
    minParticipants: 5,
    maxParticipants: 9,
    minWidth: 700,
    minHeight: 0,
  },
  {
    columns: 4,
    rows: 4,
    name: '4x4',
    minParticipants: 10,
    maxParticipants: 16,
    minWidth: 960,
    minHeight: 0,
  },
  {
    columns: 5,
    rows: 5,
    name: '5x5',
    minParticipants: 17,
    maxParticipants: 25,
    minWidth: 1100,
    minHeight: 0,
  },
];

export function selectGridLayout(
  layouts: GridLayout[],
  participantCount: number,
  width: number,
  height: number,
): GridLayout {
  // Find the best layout to fit all participants.
  let currentLayoutIndex = 0;
  let layout = layouts.find((layout_, index, allLayouts) => {
    currentLayoutIndex = index;
    const isBiggerLayoutAvailable =
      allLayouts.findIndex((l, i) => {
        const layoutIsBiggerThanCurrent = i > index;
        const layoutFitsSameAmountOfParticipants = l.maxParticipants === layout_.maxParticipants;
        return layoutIsBiggerThanCurrent && layoutFitsSameAmountOfParticipants;
      }) !== -1;
    return layout_.maxParticipants >= participantCount && !isBiggerLayoutAvailable;
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
        smallerLayout.maxParticipants,
        width,
        height,
      );
    }
  }
  return layout;
}
