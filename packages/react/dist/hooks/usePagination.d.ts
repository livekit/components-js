import { TrackReferenceOrPlaceholder } from '@livekit/components-core';
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
export declare function usePagination(itemPerPage: number, trackReferences: TrackReferenceOrPlaceholder[]): {
    totalPageCount: number;
    nextPage: () => void;
    prevPage: () => void;
    setPage: (num: number) => void;
    firstItemIndex: number;
    lastItemIndex: number;
    tracks: TrackReferenceOrPlaceholder[];
    currentPage: number;
};
export default usePagination;
//# sourceMappingURL=usePagination.d.ts.map