import { describe, test, expect } from 'vitest';
import { Layout, LAYOUTS, selectLayout } from './grid-layouts';

describe('Test correct layout for participant count with no screen size limits:', () => {
  test.each([{ participantCount: 1, expected: '1x1' }])(
    'Layout for $participantCount should be -> $expected',
    ({ participantCount, expected }) => {
      const layout = selectLayout(LAYOUTS, participantCount, 9999, 9999);
      expect(layout.name).toBe(expected);
    },
  );
  test.each([{ participantCount: 2, expected: '2x1' }])(
    'Layout for $participantCount should be -> $expected',
    ({ participantCount, expected }) => {
      const layout = selectLayout(LAYOUTS, participantCount, 9999, 9999);
      expect(layout.name).toBe(expected);
    },
  );
  test.each([
    { participantCount: 3, expected: '2x2' },
    { participantCount: 4, expected: '2x2' },
  ])('Layout for $participantCount should be -> $expected', ({ participantCount, expected }) => {
    const layout = selectLayout(LAYOUTS, participantCount, 9999, 9999);
    expect(layout.name).toBe(expected);
  });
  test.each([
    { participantCount: 5, expected: '3x3' },
    { participantCount: 6, expected: '3x3' },
    { participantCount: 7, expected: '3x3' },
    { participantCount: 8, expected: '3x3' },
    { participantCount: 9, expected: '3x3' },
  ])('Layout for $participantCount should be -> $expected', ({ participantCount, expected }) => {
    const layout = selectLayout(LAYOUTS, participantCount, 9999, 9999);
    expect(layout.name).toBe(expected);
  });
  test.each([
    { participantCount: 10, expected: '4x4' },
    { participantCount: 11, expected: '4x4' },
    { participantCount: 12, expected: '4x4' },
    { participantCount: 13, expected: '4x4' },
    { participantCount: 14, expected: '4x4' },
    { participantCount: 15, expected: '4x4' },
    { participantCount: 16, expected: '4x4' },
  ])('Layout for $participantCount should be -> $expected', ({ participantCount, expected }) => {
    const layout = selectLayout(LAYOUTS, participantCount, 9999, 9999);
    expect(layout.name).toBe(expected);
  });
});

function is_same(array1: Layout[], array2: Layout[]) {
  return (
    array1.length == array2.length &&
    array1.every((element, index) => {
      return element === array2[index];
    })
  );
}
describe('Test defined LAYOUTS valid', () => {
  test('LAYOUTS should be ordered by layout.maxParticipants', () => {
    const layouts = [...LAYOUTS];
    layouts.sort((a, b) => a.maxParticipants - b.maxParticipants);
    expect(is_same(layouts, LAYOUTS)).toBe(true);
  });
});
