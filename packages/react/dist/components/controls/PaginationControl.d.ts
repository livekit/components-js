import { usePagination } from '../../hooks';
import * as React from 'react';
export interface PaginationControlProps extends Pick<ReturnType<typeof usePagination>, 'totalPageCount' | 'nextPage' | 'prevPage' | 'currentPage'> {
    /** Reference to an HTML element that holds the pages, while interacting (`mouseover`)
     *  with it, the pagination controls will appear for a while. */
    pagesContainer?: React.RefObject<HTMLElement>;
}
export declare function PaginationControl({ totalPageCount, nextPage, prevPage, currentPage, pagesContainer: connectedElement, }: PaginationControlProps): React.JSX.Element;
//# sourceMappingURL=PaginationControl.d.ts.map