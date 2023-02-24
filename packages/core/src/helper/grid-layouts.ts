export type Layout = {
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

export const LAYOUTS: Layout[] = [
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
    minWidth: 500,
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

export function selectLayout(
  layouts: Layout[],
  participantCount: number,
  width: number,
  height: number,
): Layout {
  console.log('xxx', { participantCount }, { width }, { height });

  let currentLayoutIndex = 0;

  // Find the best layout to fit all participants.
  let layout = layouts.find((layout_, index, allLayouts) => {
    currentLayoutIndex = index;

    const biggerLayoutWithSameMaxParticipants = allLayouts.findIndex(
      (l, i) =>
        i > index && l.name !== layout_.name && l.maxParticipants === layout_.maxParticipants,
    );

    return (
      layout_.maxParticipants >= participantCount && biggerLayoutWithSameMaxParticipants === -1
    );
  });
  console.log(`Found layout with index`, { layout }, { currentLayoutIndex });

  if (layout === undefined)
    throw new Error(
      `No layout found for: participantCount: ${participantCount}, width/height: ${width}/${height} `,
    );

  // Check if the layout fits into the screen constraints. If not, recursively check the next smaller layout.
  if (width < layout.minWidth || height < layout.minHeight) {
    // const currentLayoutIndex = layouts.indexOf(layout);
    if (currentLayoutIndex > 0) {
      const smallerLayout = layouts[currentLayoutIndex - 1];
      console.log(`xxx ${smallerLayout.maxParticipants} instead of ${layout.maxParticipants}`);
      layout = selectLayout(
        layouts.slice(0, currentLayoutIndex),
        smallerLayout.maxParticipants,
        width,
        height,
      );
    }
  }
  return layout;
}
