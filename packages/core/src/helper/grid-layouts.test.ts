import { describe, test, expect } from 'vitest';
import { GRID_LAYOUTS, expandAndSortLayoutDefinitions, selectGridLayout } from './grid-layouts';

describe.concurrent('Test correct layout for participant count with no screen size limits:', () => {
  test.each([{ participantCount: 1, expected: '1x1' }])(
    'Layout for $participantCount should be -> $expected',
    ({ participantCount, expected }) => {
      const layout = selectGridLayout(GRID_LAYOUTS, participantCount, 9999, 9999);
      expect(layout.name).toBe(expected);
    },
  );
  test.each([
    { participantCount: 2, expected: '1x2', width: 720 },
    { participantCount: 2, expected: '2x1', width: 1920 },
  ])(
    'Layout for $participantCount for $width x 720 should be -> $expected',
    ({ participantCount, expected, width }) => {
      const layout = selectGridLayout(GRID_LAYOUTS, participantCount, width, 1080);
      expect(layout.name).toBe(expected);
    },
  );
  test.each([
    { participantCount: 3, expected: '2x2' },
    { participantCount: 4, expected: '2x2' },
  ])('Layout for $participantCount should be -> $expected', ({ participantCount, expected }) => {
    const layout = selectGridLayout(GRID_LAYOUTS, participantCount, 9999, 9999);
    expect(layout.name).toBe(expected);
  });
  test.each([
    { participantCount: 5, expected: '3x3' },
    { participantCount: 6, expected: '3x3' },
    { participantCount: 7, expected: '3x3' },
    { participantCount: 8, expected: '3x3' },
    { participantCount: 9, expected: '3x3' },
  ])('Layout for $participantCount should be -> $expected', ({ participantCount, expected }) => {
    const layout = selectGridLayout(GRID_LAYOUTS, participantCount, 9999, 9999);
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
    const layout = selectGridLayout(GRID_LAYOUTS, participantCount, 9999, 9999);
    expect(layout.name).toBe(expected);
  });
});

describe('Test defined GRID_LAYOUTS array is valid', () => {
  test('GRID_LAYOUTS should be ordered by layout.maxParticipants', () => {
    const layouts = expandAndSortLayoutDefinitions(GRID_LAYOUTS);
    expect(layouts).toMatchInlineSnapshot(`
      [
        {
          "columns": 1,
          "maxTiles": 1,
          "minHeight": 0,
          "minWidth": 0,
          "name": "1x1",
          "orientation": undefined,
          "rows": 1,
        },
        {
          "columns": 1,
          "maxTiles": 2,
          "minHeight": 0,
          "minWidth": 0,
          "name": "1x2",
          "orientation": "portrait",
          "rows": 2,
        },
        {
          "columns": 2,
          "maxTiles": 2,
          "minHeight": 0,
          "minWidth": 0,
          "name": "2x1",
          "orientation": "landscape",
          "rows": 1,
        },
        {
          "columns": 2,
          "maxTiles": 4,
          "minHeight": 0,
          "minWidth": 560,
          "name": "2x2",
          "orientation": undefined,
          "rows": 2,
        },
        {
          "columns": 3,
          "maxTiles": 9,
          "minHeight": 0,
          "minWidth": 700,
          "name": "3x3",
          "orientation": undefined,
          "rows": 3,
        },
        {
          "columns": 4,
          "maxTiles": 16,
          "minHeight": 0,
          "minWidth": 960,
          "name": "4x4",
          "orientation": undefined,
          "rows": 4,
        },
        {
          "columns": 5,
          "maxTiles": 25,
          "minHeight": 0,
          "minWidth": 1100,
          "name": "5x5",
          "orientation": undefined,
          "rows": 5,
        },
      ]
    `);
  });
});

describe.concurrent(
  'Test switch to smaller grid layout if screen width limit is not satisfied.',
  () => {
    test.each([
      { desiredGrid: { columns: 4, rows: 4 }, expected: { columns: 3, rows: 3 } },
      { desiredGrid: { columns: 5, rows: 5 }, expected: { columns: 4, rows: 4 } },
      { desiredGrid: { columns: 3, rows: 3 }, expected: { columns: 2, rows: 2 } },
    ])(
      'If the minimum width for the $desiredGrid layout is not satisfied, switch to smaller layout ($expected).',
      ({ desiredGrid, expected }) => {
        const desiredLayout = expandAndSortLayoutDefinitions(GRID_LAYOUTS).find(
          (layout_) => layout_.columns === desiredGrid.columns && layout_.rows === desiredGrid.rows,
        );
        if (desiredLayout === undefined) throw new Error('Could not find the desired layout.');

        const widthToSmallForDesiredLayout = desiredLayout.minWidth - 1;
        const layout = selectGridLayout(
          GRID_LAYOUTS,
          desiredLayout.maxTiles,
          widthToSmallForDesiredLayout,
          9999,
        );
        expect(layout.columns).toBe(expected.columns);
        expect(layout.rows).toBe(expected.rows);
      },
    );
  },
);
