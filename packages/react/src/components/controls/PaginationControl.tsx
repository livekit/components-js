import * as React from 'react';
import SvgChevron from '../../assets/icons/Chevron';
import type { usePagination } from '../../hooks';

export function PaginationControl({
  totalPageCount,
  nextPage,
  prevPage,
  currentPage,
}: ReturnType<typeof usePagination>) {
  return (
    <div className="lk-pagination-control" style={{}}>
      <button className="lk-button" onClick={prevPage}>
        <SvgChevron />
      </button>
      <span className="lk-pagination-count">{`${currentPage} of ${totalPageCount}`}</span>
      <button className="lk-button" onClick={nextPage}>
        <SvgChevron />
      </button>
    </div>
  );
}
