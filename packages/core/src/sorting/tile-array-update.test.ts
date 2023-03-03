import { describe, test, expect } from 'vitest';
import { swapItems, visualPageChange } from './tile-array-update';

describe('Test visualPageChange function.', () => {
  test.each([
    // { state: [1, 2, 3, 4, 5], next: [1, 2, 3, 4, 5], expected: [] },
    // { state: [], next: [], expected: [] },
    // { state: [1, 2], next: [2, 1], expected: [] },
    // { state: [1, 2, 3], next: [2, 3, 1], expected: [] },
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
