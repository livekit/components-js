import type { TrackReferenceOrPlaceholder } from '@livekit/components-core';
import * as React from 'react';
import { useVisualStableUpdate } from './useVisualStableUpdate';

/**
 * The `usePagination` hook implements simple pagination logic for use with arrays.
 * @example
 * ```tsx
 * const tracks = useTracks();
 * const pagination = usePagination(4, tracks);
 *
 * <TrackLoop tracks={pagination.tracks} />
 * ```
 * @alpha
 */
export function usePagination(itemPerPage: number, trackReferences: TrackReferenceOrPlaceholder[]) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const totalPageCount = Math.max(Math.ceil(trackReferences.length / itemPerPage), 1);
  if (currentPage > totalPageCount) {
    setCurrentPage(totalPageCount);
  }
  const lastItemIndex = currentPage * itemPerPage;
  const firstItemIndex = lastItemIndex - itemPerPage;

  const changePage = (direction: 'next' | 'previous') => {
    setCurrentPage((state) => {
      if (direction === 'next') {
        if (state === totalPageCount) {
          return state;
        }
        return state + 1;
      } else {
        if (state === 1) {
          return state;
        }
        return state - 1;
      }
    });
  };

  const goToPage = (num: number) => {
    if (num > totalPageCount) {
      setCurrentPage(totalPageCount);
    } else if (num < 1) {
      setCurrentPage(1);
    } else {
      setCurrentPage(num);
    }
  };

  const updatedTrackReferences = useVisualStableUpdate(trackReferences, itemPerPage);

  const tracksOnPage = updatedTrackReferences.slice(firstItemIndex, lastItemIndex);

  return {
    totalPageCount,
    nextPage: () => changePage('next'),
    prevPage: () => changePage('previous'),
    setPage: goToPage,
    firstItemIndex,
    lastItemIndex,
    tracks: tracksOnPage,
    currentPage,
  };
}

export default usePagination;
