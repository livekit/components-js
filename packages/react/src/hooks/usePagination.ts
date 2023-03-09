import { useState } from 'react';

/**
 * The `usePagination` hook implements simple pagination logic for use with arrays.
 * @example
 * ```tsx
 * const { firstItemIndex, lastItemIndex } = usePagination(3, 9);
 * const itemsOnPage = items.slice(firsItemIndex, lastItemIndex)
 * ```
 * @internal
 */
export function usePagination(itemPerPage: number, totalItemCount: number) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPageCount = Math.ceil(totalItemCount / itemPerPage);
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

  return {
    totalPageCount,
    nextPage: () => changePage('next'),
    prevPage: () => changePage('previous'),
    setPage: goToPage,
    firstItemIndex,
    lastItemIndex,
    currentPage,
  };
}

export default usePagination;
