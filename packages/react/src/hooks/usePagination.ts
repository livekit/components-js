import { useState } from 'react';

export function usePagination(itemPerPage: number, totalItemCount: number) {
  const [page, setPage] = useState(1);
  const pageCount = Math.ceil(totalItemCount / itemPerPage);
  const lastItemIndex = page * itemPerPage;
  const firstItemIndex = lastItemIndex - itemPerPage;

  const changePage = (direction: 'next' | 'previous') => {
    setPage((state) => {
      if (direction === 'next') {
        if (state === pageCount) {
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
    if (num > pageCount) {
      setPage(pageCount);
    } else if (num < 1) {
      setPage(1);
    } else {
      setPage(num);
    }
  };

  return {
    totalPages: pageCount,
    nextPage: () => changePage('next'),
    prevPage: () => changePage('previous'),
    setPage: setPage_,
    firstItemIndex,
    lastItemIndex,
    page,
  };
}

export default usePagination;
