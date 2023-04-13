import * as React from 'react';

export type PaginationIndicatorProps = {
  totalPageCount: number;
  currentPage: number;
};

export function PaginationIndicator({ totalPageCount, currentPage }: PaginationIndicatorProps) {
  const bubbles = new Array(totalPageCount).fill('').map((_, index) => {
    if (index + 1 === currentPage) {
      return <span data-lk-active key={index} />;
    } else {
      return <span key={index} />;
    }
  });

  return <div className="lk-pagination-indicator">{bubbles}</div>;
}
