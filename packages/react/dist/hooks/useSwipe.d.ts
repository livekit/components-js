import * as React from 'react';
/**
 * @alpha
 */
export type UseSwipeOptions = {
    minSwipeDistance?: number;
    onLeftSwipe?: () => void;
    onRightSwipe?: () => void;
};
/**
 * Simple implementation to detect horizontal swipe actions.
 * Accepts callbacks for on right and left swipes.
 * @example
 * ```tsx
 *  <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
 * ```
 * @alpha
 */
export declare function useSwipe(element: React.RefObject<HTMLElement>, options?: UseSwipeOptions): void;
//# sourceMappingURL=useSwipe.d.ts.map