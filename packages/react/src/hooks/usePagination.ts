import { useState } from 'react';

interface UsePaginationProps {
  contentPerPage: number;
  count: number;
}

interface UsePaginationReturn {
  page: number;
  totalPages: number;
  firstItemIndex: number;
  lastItemIndex: number;
  nextPage: () => void;
  prevPage: () => void;
  setPage: (page: number) => void;
}

export function usePagination({ contentPerPage, count }: UsePaginationProps): UsePaginationReturn {
  const [page, setPage] = useState(1);
  const pageCount = Math.ceil(count / contentPerPage);
  const lastItemIndex = page * contentPerPage;
  const firstItemIndex = lastItemIndex - contentPerPage;

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
