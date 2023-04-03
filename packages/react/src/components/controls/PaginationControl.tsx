import * as React from 'react';
import SvgChevron from '../../assets/icons/Chevron';
import type { usePagination } from '../../hooks';
import { createInteractingObservable } from '@livekit/components-core';

export type PaginationControlProps = Pick<
  ReturnType<typeof usePagination>,
  'totalPageCount' | 'nextPage' | 'prevPage' | 'currentPage'
> & {
  /** Reference to an HTML element that holds the pages, while interacting (`mouseover`)
   *  with it, the pagination controls will appear for a while. */
  pagesContainer?: React.RefObject<HTMLElement>;
};

export function PaginationControl({
  totalPageCount,
  nextPage,
  prevPage,
  currentPage,
  pagesContainer: connectedElement,
}: PaginationControlProps) {
  const [interactive, setInteractive] = React.useState(false);
  React.useEffect(() => {
    let subscription:
      | ReturnType<ReturnType<typeof createInteractingObservable>['subscribe']>
      | undefined;
    if (connectedElement) {
      subscription = createInteractingObservable(connectedElement.current, 2000).subscribe(
        setInteractive,
      );
    }
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [connectedElement]);

  return (
    <div className="lk-pagination-control" data-lk-user-interaction={interactive}>
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
