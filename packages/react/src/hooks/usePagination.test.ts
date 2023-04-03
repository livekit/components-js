import { describe, test, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import usePagination from './usePagination';
import type { TrackReferenceOrPlaceholder } from '@livekit/components-core';

describe('Test hook', () => {
  test('Test basic assumptions of the usePagination hook return values.', () => {
    const itemPerPage = 4;
    const totalTrackRefs = new Array(12) as TrackReferenceOrPlaceholder[];
    const { result } = renderHook(() => usePagination(itemPerPage, totalTrackRefs));

    expect(result.current.currentPage).toBe(1);
    expect(result.current.totalPageCount).toBe(3);
    expect(result.current.firstItemIndex).toBe(0);
    expect(result.current.lastItemIndex).toBe(4);
    expect(result.current.prevPage).toBeTypeOf('function');
    expect(result.current.nextPage).toBeTypeOf('function');
  });
  test('Test moving to pages works as expected.', () => {
    const itemPerPage = 4;
    const totalTrackRefs = new Array(12) as TrackReferenceOrPlaceholder[];
    const { result, rerender } = renderHook(() => usePagination(itemPerPage, totalTrackRefs));

    expect(result.current.currentPage).toBe(1);

    result.current.nextPage();
    rerender();
    expect(result.current.currentPage).toBe(2);

    result.current.nextPage();
    rerender();
    expect(result.current.currentPage).toBe(3);

    // Check top limit is working.
    result.current.nextPage();
    rerender();
    expect(result.current.currentPage).toBe(3);

    result.current.prevPage();
    rerender();
    expect(result.current.currentPage).toBe(2);

    result.current.prevPage();
    rerender();
    expect(result.current.currentPage).toBe(1);

    // Test bottom limit is working.
    result.current.prevPage();
    rerender();
    expect(result.current.currentPage).toBe(1);
  });

  test('Test jumping to pages works as expected.', () => {
    const itemPerPage = 4;
    const totalTrackRefs = new Array(12) as TrackReferenceOrPlaceholder[];
    const { result, rerender } = renderHook(() => usePagination(itemPerPage, totalTrackRefs));
    expect(result.current.currentPage).toBe(1);

    result.current.setPage(3);
    rerender();
    expect(result.current.currentPage).toBe(3);

    result.current.setPage(2);
    rerender();
    expect(result.current.currentPage).toBe(2);

    // Jumping to a index that is lower than 1 jumps to page 1.
    result.current.setPage(0);
    rerender();
    expect(result.current.currentPage).toBe(1);

    // Jumping to a index that is higher than the last page jumps to last page.
    result.current.setPage(999999);
    rerender();
    expect(result.current.currentPage).toBe(3);
  });
});
