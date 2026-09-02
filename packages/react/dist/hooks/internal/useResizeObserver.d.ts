import * as React from 'react';
/**
 * A React hook that fires a callback whenever ResizeObserver detects a change to its size
 * code extracted from https://github.com/jaredLunde/react-hook/blob/master/packages/resize-observer/src/index.tsx in order to not include the polyfill for resize-observer
 *
 * @internal
 */
export declare function useResizeObserver<T extends HTMLElement>(target: React.RefObject<T>, callback: UseResizeObserverCallback): ResizeObserver | undefined;
export type UseResizeObserverCallback = (entry: ResizeObserverEntry, observer: ResizeObserver) => unknown;
export declare const useSize: (target: React.RefObject<HTMLDivElement>) => {
    width: number;
    height: number;
};
//# sourceMappingURL=useResizeObserver.d.ts.map