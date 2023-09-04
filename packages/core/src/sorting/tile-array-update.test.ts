import { Track } from 'livekit-client';
import { describe, test, expect } from 'vitest';
import {
  flatTrackReferenceArray,
  mockTrackReferencePlaceholder,
  mockTrackReferenceSubscribed,
} from '../track-reference/test-utils';
import { divideIntoPages, swapItems, updatePages, visualPageChange } from './tile-array-update';
import type { TrackReferenceOrPlaceholder } from '../track-reference';

const stateNextExpectedString = (text: string) =>
  `${text}:\n$state \t\t<= t\n$next \t\t<= t+1\n--------\n$expected  \t<= expected result`;

describe('Test visualPageChange function.', () => {
  test.each([
    { state: [], next: [], expected: { dropped: [], added: [] } },
    { state: [1, 2, 3], next: [1, 2, 3], expected: { dropped: [], added: [] } },
    { state: [1, 2], next: [2, 1], expected: { dropped: [], added: [] } },
  ])('Arrays with the same members should not tigger a update.', ({ state, next, expected }) => {
    const result = visualPageChange(state, next);
    expect(result).toStrictEqual(expected);
  });

  test.each([
    { state: [1, 2, 3], next: [1, 2, 4], expected: { dropped: [3], added: [4] } },
    { state: [1, 2, 3], next: [1, 9, 3], expected: { dropped: [2], added: [9] } },
    { state: [], next: [1, 2, 3], expected: { dropped: [], added: [1, 2, 3] } },
    { state: [1, 2, 3], next: [], expected: { dropped: [1, 2, 3], added: [] } },
    { state: [1, 2, 3], next: [4, 5, 6], expected: { dropped: [1, 2, 3], added: [4, 5, 6] } },
  ])('Arrays with different members should trigger a update.', ({ state, next, expected }) => {
    const result = visualPageChange(state, next);
    expect(result).toStrictEqual(expected);
  });
});

describe('Test swapping items', () => {
  test.each([
    { moveForward: 1, moveBack: 3, list: [1, 2, 3], expected: [3, 2, 1] },
    { moveForward: 2, moveBack: 1, list: [1, 2, 3], expected: [2, 1, 3] },
    { moveForward: 2, moveBack: 1, list: [1, 2, 3, 4, 5], expected: [2, 1, 3, 4, 5] },
    { moveForward: 4, moveBack: 2, list: [1, 2, 3, 4, 5], expected: [1, 4, 3, 2, 5] },
  ])('', ({ moveForward, moveBack, list, expected }) => {
    const result = swapItems<number>(moveForward, moveBack, list);
    expect(result).toStrictEqual(expected);
  });
});

describe('Test dividing list into pages.', () => {
  test.each([
    {
      state: [1, 2, 3, 4, 5, 6],
      itemsOnPage: 3,
      expected: [
        [1, 2, 3],
        [4, 5, 6],
      ],
    },
    {
      state: [1, 2, 3, 4, 5, 6],
      itemsOnPage: 2,
      expected: [
        [1, 2],
        [3, 4],
        [5, 6],
      ],
    },
    {
      state: [1, 2, 3, 4, 5, 6],
      itemsOnPage: 4,
      expected: [
        [1, 2, 3, 4],
        [5, 6],
      ],
    },
  ])('', ({ state, itemsOnPage, expected }) => {
    const result = divideIntoPages(state, itemsOnPage);
    expect(result).toStrictEqual(expected);
  });
});

describe('Test updating the list based while considering pages.', () => {
  test.each([
    {
      state: [1, 2, 3, 4, 5, 6],
      next: [2, 1, 3, 4, 5, 6],
      expected: [1, 2, 3, 4, 5, 6],
      itemsOnPage: 3,
    },
    {
      state: [1, 2, 3, 4, 5, 6],
      next: [6, 2, 3, 4, 5, 1],
      expected: [6, 2, 3, 4, 5, 1],
      itemsOnPage: 3,
    },
    {
      state: [1, 2, 3, 4],
      next: [1, 2, 3],
      expected: [1, 2, 3],
      itemsOnPage: 2,
    },
    {
      state: [1, 2, 3, 4],
      next: [2, 3, 4],
      expected: [3, 2, 4],
      itemsOnPage: 2,
    },
    {
      state: [1, 2, 3, 4, 5, 6],
      next: [1, 2, 3, 5, 6],
      expected: [1, 2, 3, 5, 6],
      itemsOnPage: 2,
    },
    {
      state: [1, 2, 3, 4, 5, 6],
      next: [1, 2, 4, 5, 6],
      expected: [1, 2, 5, 4, 6],
      itemsOnPage: 2,
    },
    {
      state: [1, 2, 3, 4],
      next: [2, 3, 4],
      expected: [3, 2, 4],
      itemsOnPage: 2,
    },
  ])('Test removing exactly one items from list:', ({ state, next, itemsOnPage, expected }) => {
    const result = updatePages<number>(state, next, itemsOnPage);
    expect(result).toStrictEqual(expected);
  });

  test.each([
    {
      state: [
        mockTrackReferenceSubscribed('A', Track.Source.Camera),
        mockTrackReferenceSubscribed('B', Track.Source.Camera),
      ],
      next: [mockTrackReferenceSubscribed('B', Track.Source.Camera)],
      expected: [mockTrackReferenceSubscribed('B', Track.Source.Camera)],
      itemsOnPage: 3,
    },
    {
      state: [
        mockTrackReferenceSubscribed('A', Track.Source.Camera),
        mockTrackReferenceSubscribed('B', Track.Source.Camera),
        mockTrackReferenceSubscribed('C', Track.Source.Camera),
        mockTrackReferenceSubscribed('D', Track.Source.Camera),
      ],
      next: [
        mockTrackReferenceSubscribed('B', Track.Source.Camera),
        mockTrackReferenceSubscribed('C', Track.Source.Camera),
        mockTrackReferenceSubscribed('D', Track.Source.Camera),
      ],
      expected: [
        mockTrackReferenceSubscribed('C', Track.Source.Camera),
        mockTrackReferenceSubscribed('B', Track.Source.Camera),
        mockTrackReferenceSubscribed('D', Track.Source.Camera),
      ],
      itemsOnPage: 2,
    },
  ])(
    'Test removing exactly one items from list: (trackReference version)',
    ({ state, next, itemsOnPage, expected }) => {
      const result = updatePages(state, next, itemsOnPage);
      expect(flatTrackReferenceArray(result)).toStrictEqual(flatTrackReferenceArray(expected));
    },
  );

  test.each([
    {
      state: [1, 2, 3, 4, 5, 6],
      next: [1, 2, 5, 6],
      expected: [1, 2, 5, 6],
      itemsOnPage: 2,
    },
    {
      state: [1, 2, 3, 4, 5, 6],
      next: [1, 2, 5],
      expected: [1, 2, 5],
      itemsOnPage: 2,
    },
    {
      state: [1, 2, 3, 4, 5, 6],
      next: [],
      expected: [],
      itemsOnPage: 2,
    },
  ])(
    'Test removing more than one item from the list:',
    ({ state, next, itemsOnPage, expected }) => {
      const result = updatePages(state, next, itemsOnPage);
      expect(result).toStrictEqual(expected);
    },
  );

  test.each([
    {
      state: [
        mockTrackReferenceSubscribed('A', Track.Source.Camera),
        mockTrackReferenceSubscribed('B', Track.Source.Camera),
        mockTrackReferenceSubscribed('C', Track.Source.Camera),
        mockTrackReferenceSubscribed('D', Track.Source.Camera),
      ],
      next: [
        mockTrackReferenceSubscribed('B', Track.Source.Camera),
        mockTrackReferenceSubscribed('D', Track.Source.Camera),
      ],
      expected: [
        mockTrackReferenceSubscribed('D', Track.Source.Camera),
        mockTrackReferenceSubscribed('B', Track.Source.Camera),
      ],
      itemsOnPage: 2,
    },
    {
      state: [
        mockTrackReferenceSubscribed('A', Track.Source.Camera),
        mockTrackReferenceSubscribed('B', Track.Source.Camera),
        mockTrackReferenceSubscribed('C', Track.Source.Camera),
        mockTrackReferenceSubscribed('D', Track.Source.Camera),
      ],
      next: [
        mockTrackReferenceSubscribed('B', Track.Source.Camera),
        mockTrackReferenceSubscribed('C', Track.Source.Camera),
      ],
      expected: [
        mockTrackReferenceSubscribed('C', Track.Source.Camera),
        mockTrackReferenceSubscribed('B', Track.Source.Camera),
      ],
      itemsOnPage: 2,
    },
    {
      state: [
        mockTrackReferenceSubscribed('A', Track.Source.Camera),
        mockTrackReferenceSubscribed('B', Track.Source.Camera),
        mockTrackReferenceSubscribed('C', Track.Source.Camera),
        mockTrackReferenceSubscribed('D', Track.Source.Camera),
      ],
      next: [],
      expected: [],
      itemsOnPage: 2,
    },
  ])(
    'Test removing more than one item from the list (trackReference version): ',
    ({ state, next, itemsOnPage, expected }) => {
      const result = updatePages(state, next, itemsOnPage);
      expect(flatTrackReferenceArray(result)).toStrictEqual(flatTrackReferenceArray(expected));
    },
  );

  test.each([
    {
      state: [1, 2, 3],
      next: [1, 2, 3, 4],
      // 4 got added
      expected: [1, 2, 3, 4],
      itemsOnPage: 2,
    },
    {
      state: [1, 2, 3, 4],
      next: [1, 5, 2, 3, 4],
      // 4 got added
      expected: [1, 5, 3, 2, 4],
      itemsOnPage: 2,
    },
    {
      state: [1, 2, 3, 4],
      next: [1, 5, 2, 3, 4],
      // 5 got added
      expected: [1, 5, 3, 2, 4],
      itemsOnPage: 2,
    },
    {
      state: [1, 2],
      next: [1, 2, 3, 4],
      // 3,4 got added
      expected: [1, 2, 3, 4],
      itemsOnPage: 2,
    },
    {
      state: [1, 2, 3, 4],
      next: [1, 2, 5, 6, 3, 4],
      // 5, 6 got added
      expected: [1, 2, 5, 6, 3, 4],
      itemsOnPage: 2,
    },
    {
      state: [1, 2],
      next: [1, 3, 2],
      // 5, 6 got added
      expected: [1, 2, 3],
      itemsOnPage: 3,
    },
  ])(
    stateNextExpectedString('Add item(s) to list (number version)'),
    ({ state, next, itemsOnPage, expected }) => {
      const result = updatePages(state, next, itemsOnPage);
      expect(result).toHaveLength(next.length);
      expect(result).toStrictEqual(expected);
    },
  );

  test.each([
    {
      state: [
        mockTrackReferenceSubscribed('A', Track.Source.Camera),
        mockTrackReferenceSubscribed('B', Track.Source.Camera),
      ],
      next: [
        mockTrackReferenceSubscribed('A', Track.Source.Camera),
        mockTrackReferenceSubscribed('B', Track.Source.Camera),
        mockTrackReferenceSubscribed('C', Track.Source.Camera),
      ],
      expected: [
        mockTrackReferenceSubscribed('A', Track.Source.Camera),
        mockTrackReferenceSubscribed('B', Track.Source.Camera),
        mockTrackReferenceSubscribed('C', Track.Source.Camera),
      ],
      itemsOnPage: 2,
    },
    {
      state: [
        mockTrackReferenceSubscribed('A', Track.Source.Camera),
        mockTrackReferenceSubscribed('B', Track.Source.Camera),
      ],
      next: [
        mockTrackReferenceSubscribed('A', Track.Source.Camera),
        mockTrackReferenceSubscribed('C', Track.Source.Camera),
        mockTrackReferenceSubscribed('B', Track.Source.Camera),
      ],
      expected: [
        mockTrackReferenceSubscribed('A', Track.Source.Camera),
        mockTrackReferenceSubscribed('B', Track.Source.Camera),
        mockTrackReferenceSubscribed('C', Track.Source.Camera),
      ],
      itemsOnPage: 3,
    },
  ])('Test adding items:', ({ state, next, itemsOnPage, expected }) => {
    const result = updatePages(state, next, itemsOnPage);
    expect(result).toHaveLength(next.length);
    expect(flatTrackReferenceArray(result)).toStrictEqual(flatTrackReferenceArray(expected));
  });

  // FIXME: mute for implementation unmute before production.
  test.each([
    {
      state: [mockTrackReferencePlaceholder('A', Track.Source.Camera)],
      next: [
        mockTrackReferenceSubscribed('A', Track.Source.Camera, { mockPublication: true }),
      ] as TrackReferenceOrPlaceholder[],
      expected: [mockTrackReferenceSubscribed('A', Track.Source.Camera, { mockPublication: true })],
      itemsOnPage: 1,
    },
  ])(
    'Test track reference type change from `TrackReferencePlaceholder` to `TrackReference`',
    ({ state, next, itemsOnPage, expected }) => {
      const result = updatePages(state, next, itemsOnPage);
      expect(result).toHaveLength(next.length);
      expect(flatTrackReferenceArray(result)).toStrictEqual(flatTrackReferenceArray(expected));
      expect(result[0].publication).toBeDefined();
    },
  );
});
