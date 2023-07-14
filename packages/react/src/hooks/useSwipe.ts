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
export function useSwipe(element: React.RefObject<HTMLElement>, options: UseSwipeOptions = {}) {
  const touchStart = React.useRef<number | null>(null);
  const touchEnd = React.useRef<number | null>(null);

  // The required distance between touchStart and touchEnd to be detected as a swipe.
  const minSwipeDistance = options.minSwipeDistance ?? 50;

  const onTouchStart = (event: TouchEvent) => {
    touchEnd.current = null; // Otherwise the swipe is fired even with usual touch events.
    touchStart.current = event.targetTouches[0].clientX;
  };

  const onTouchMove = (event: TouchEvent) => {
    touchEnd.current = event.targetTouches[0].clientX;
  };

  const onTouchEnd = React.useCallback(() => {
    if (!touchStart.current || !touchEnd.current) {
      return;
    }
    const distance = touchStart.current - touchEnd.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && options.onLeftSwipe) options.onLeftSwipe();
    if (isRightSwipe && options.onRightSwipe) options.onRightSwipe();
  }, [minSwipeDistance, options]);

  React.useEffect(() => {
    const elementCopy = element.current;
    if (elementCopy) {
      elementCopy.addEventListener('touchstart', onTouchStart, { passive: true });
      elementCopy.addEventListener('touchmove', onTouchMove, { passive: true });
      elementCopy.addEventListener('touchend', onTouchEnd, { passive: true });
    }
    return () => {
      if (elementCopy) {
        elementCopy.removeEventListener('touchstart', onTouchStart);
        elementCopy.removeEventListener('touchmove', onTouchMove);
        elementCopy.removeEventListener('touchend', onTouchEnd);
      }
    };
  }, [element, onTouchEnd]);
}
