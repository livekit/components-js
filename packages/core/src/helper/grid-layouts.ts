// import { log } from '../logger';

/**
 * @public
 */
export type GridLayoutDefinition = {
  /** Column count of the grid layout. */
  columns: number;
  /** Row count of the grid layout. */
  rows: number;
  // # Constraints that have to be meet to use this layout.
  /**
   * Minimum grid container width required to use this layout.
   * @remarks
   * If this constraint is not met, we try to select a layout with fewer tiles
   * (`tiles=columns*rows`) that is within the constraint.
   */
  minWidth?: number;
  /**
   * Minimum grid container height required to use this layout.
   * @remarks
   * If this constraint is not met, we try to select a layout with fewer tiles
   * (`tiles=columns*rows`) that is within the constraint.
   */
  minHeight?: number;
  /**
   * For which orientation the layout definition should be applied.
   * Will be used for both landscape and portrait if no value is specified.
   */
  orientation?: 'landscape' | 'portrait';
};

export type GridLayoutInfo = {
  /** Layout name (convention `<column_count>x<row_count>`). */
  name?: string;
  /** Column count of the layout. */
  columns?: number;
  /** Row count of the layout. */
  rows?: number;
  // # Constraints that have to be meet to use this layout.
  // ## 1. Participant range:
  /** Maximum tiles that fit into this layout. */
  maxTiles?: number;
  // ## 2. Screen size limits:
  /** Minimum width required to use this layout. */
  minWidth?: number;
  /** Minimum height required to use this layout. */
  minHeight?: number;
  orientation?: 'landscape' | 'portrait';
  wrapperStyle?: {
    gridTemplateColumns?: string;
    height?: string;
  };
  gridColumns?: string[];
};

export const GRID_LAYOUTS: GridLayoutDefinition[] = [
  {
    columns: 1,
    rows: 1,
  },
  {
    columns: 1,
    rows: 2,
    orientation: 'portrait',
  },
  {
    columns: 2,
    rows: 1,
    orientation: 'landscape',
  },
  {
    columns: 2,
    rows: 2,
    minWidth: 560,
  },
  {
    columns: 3,
    rows: 3,
    minWidth: 700,
  },
  {
    columns: 4,
    rows: 4,
    minWidth: 960,
  },
  {
    columns: 5,
    rows: 5,
    minWidth: 1100,
  },
] as const;

export const NEW_LAYOUT_CONFIG = [
  { condition: (num: number) => num === 1 },
  {
    condition: (num: number) => num === 2,
    wrapperStyle: {
      gridTemplateColumns: '1fr 1fr',
      width: '100%',
      height: '28.3vw',
    },
  },
  {
    condition: (num: number) => num === 3,
    wrapperStyle: {
      gridTemplateColumns: `repeat(4, 1fr)`,
      gridTemplateRows: '1fr 1fr',
      width: '100%',
      height: '56.25vw',
    },
    gridColumns: ['1 / 3', '3 / 5', '2 / 4'],
  },
  {
    condition: (num: number) => num === 4,
    wrapperStyle: {
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: '1fr 1fr',
      width: '100%',
      height: '56.25vw',
    },
  },
  {
    condition: (num: number) => num === 5,
    wrapperStyle: {
      gridTemplateColumns: `repeat(6, 1fr)`,
      gridTemplateRows: '1fr 1fr',
      height: '56.25vw',
    },
    gridColumns: ['1 / 4', '4 / 7', '1 / 3', '3 / 5', '5 / 7'],
  },
  {
    condition: (num: number) => num === 6,
    wrapperStyle: {
      gridTemplateColumns: `repeat(3, 1fr)`,
      gridTemplateRows: '1fr 1fr',
      height: '50vw',
    },
  },
  {
    condition: (num: number) => num === 7,
    wrapperStyle: {
      gridTemplateColumns: `repeat(12, 1fr)`,
      gridTemplateRows: `1fr 1fr`,
      height: '50vw',
    },
    gridColumns: ['1 / 5', '5 / 9', '9 / 13', '1 / 4', '4 / 7', '7 / 10', '10 / 13'],
  },
  {
    condition: (num: number) => num === 8,
    wrapperStyle: {
      gridTemplateColumns: `repeat(6, 1fr)`,
      gridTemplateRows: `repeat(3, 1fr)`,
      height: '100%',
    },
    gridColumns: ['1 / 3', '3 / 5', '5 / 7', '1 / 3', '3 / 5', '5 / 7', '2 / 4', '4 / 6'],
  },
  {
    condition: (num: number) => num === 9,
    wrapperStyle: {
      gridTemplateColumns: `repeat(3, 1fr)`,
      gridTemplateRows: `repeat(3, 1fr)`,
      height: '100%',
    },
  },
  {
    condition: (num: number) => num > 9,
    wrapperStyle: {
      gridTemplateColumns: `repeat(4, 1fr)`,
      gridTemplateRows: `repeat(4, 1fr)`,
      height: '100%',
    },
  },
];

export function selectGridLayout(
  layoutDefinitions: GridLayoutDefinition[],
  participantCount: number,
  // width: number,
  // height: number,
): GridLayoutInfo {
  if (layoutDefinitions.length < 1) {
    throw new Error('At least one grid layout definition must be provided.');
  }

  const newLayout = NEW_LAYOUT_CONFIG.find((layout) => layout.condition(participantCount))!;
  return newLayout;

  // const layouts = expandAndSortLayoutDefinitions(layoutDefinitions);
  // if (width <= 0 || height <= 0) {
  //   return layouts[0];
  // }
  // // Find the best layout to fit all participants.
  // let currentLayoutIndex = 0;
  // const containerOrientation = width / height > 1 ? 'landscape' : 'portrait';
  // let layout = layouts.find((layout_, index, allLayouts) => {
  //   currentLayoutIndex = index;
  //   const isBiggerLayoutAvailable =
  //     allLayouts.findIndex((l, i) => {
  //       const fitsOrientation = !l.orientation || l.orientation === containerOrientation;
  //       const layoutIsBiggerThanCurrent = i > index;
  //       const layoutFitsSameAmountOfParticipants = l.maxTiles === layout_.maxTiles;
  //       return layoutIsBiggerThanCurrent && layoutFitsSameAmountOfParticipants && fitsOrientation;
  //     }) !== -1;
  //   return layout_.maxTiles >= participantCount && !isBiggerLayoutAvailable;
  // });
  // if (layout === undefined) {
  //   layout = layouts[layouts.length - 1];
  //   if (layout) {
  //     log.warn(
  //       `No layout found for: participantCount: ${participantCount}, width/height: ${width}/${height} fallback to biggest available layout (${layout}).`,
  //     );
  //   } else {
  //     throw new Error(`No layout or fallback layout found.`);
  //   }
  // }

  // // Check if the layout fits into the screen constraints. If not, recursively check the next smaller layout.
  // if (width < layout.minWidth || height < layout.minHeight) {
  //   // const currentLayoutIndex = layouts.indexOf(layout);
  //   if (currentLayoutIndex > 0) {
  //     const smallerLayout = layouts[currentLayoutIndex - 1];
  //     layout = selectGridLayout(
  //       layouts.slice(0, currentLayoutIndex),
  //       smallerLayout.maxTiles,
  //       width,
  //       height,
  //     );
  //   }
  // }
  // return layout;
}

/**
 * @internal
 */
export function expandAndSortLayoutDefinitions(layouts: GridLayoutDefinition[]): GridLayoutInfo[] {
  return [...layouts]
    .map((layout) => {
      return {
        name: `${layout.columns}x${layout.rows}`,
        columns: layout.columns,
        rows: layout.rows,
        maxTiles: layout.columns * layout.rows,
        minWidth: layout.minWidth ?? 0,
        minHeight: layout.minHeight ?? 0,
        orientation: layout.orientation,
      } satisfies GridLayoutInfo;
    })
    .sort((a, b) => {
      if (a.maxTiles !== b.maxTiles) {
        return a.maxTiles - b.maxTiles;
      } else if (a.minWidth !== 0 || b.minWidth !== 0) {
        return a.minWidth - b.minWidth;
      } else if (a.minHeight !== 0 || b.minHeight !== 0) {
        return a.minHeight - b.minHeight;
      } else {
        return 0;
      }
    });
}
