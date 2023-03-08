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
  const [page, setPage] = useState(1);
  const totalPageCount = Math.ceil(totalItemCount / itemPerPage);
  const lastItemIndex = page * itemPerPage;
  const firstItemIndex = lastItemIndex - itemPerPage;

  const changePage = (direction: 'next' | 'previous') => {
    setPage((state) => {
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

  const setPage_ = (num: number) => {
    if (num > totalPageCount) {
      setPage(totalPageCount);
    } else if (num < 1) {
      setPage(1);
    } else {
      setPage(num);
    }
  };

  return {
    totalPageCount,
    nextPage: () => changePage('next'),
    prevPage: () => changePage('previous'),
    setPage: setPage_,
    firstItemIndex,
    lastItemIndex,
    page,
  };
}

export default usePagination;
