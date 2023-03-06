import { describe, test, expect } from 'vitest';
import { divideIntoPages, swapItems, updatePages, visualPageChange } from './tile-array-update';

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

describe.only('Test updating pages only if needed', () => {
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
      // 4 got dropped
      expected: [1, 2, 3, 5, 6],
      itemsOnPage: 2,
    },
    {
      state: [1, 2, 3, 4, 5, 6],
      next: [1, 2, 4, 5, 6],
      // 3 got dropped
      expected: [1, 2, 5, 4, 6],
      itemsOnPage: 2,
    },
  ])('', ({ state, next, itemsOnPage, expected }) => {
    const result = updatePages<number>(state, next, itemsOnPage);
    expect(result).toStrictEqual(expected);
  });
});
