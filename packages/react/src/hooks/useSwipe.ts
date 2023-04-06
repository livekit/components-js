import * as React from 'react';

type UseSwipeOptions = {
  minSwipeDistance?: number;
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
 * @internal
 * ```
 */
export function useSwipe(
  onLeftSwipe: () => void,
  onRightSwipe: () => void,
  options: UseSwipeOptions = {},
) {
  const [touchStart, setTouchStart] = React.useState<number | null>(null);
  const [touchEnd, setTouchEnd] = React.useState<number | null>(null);

  // the required distance between touchStart and touchEnd to be detected as a swipe
  const minSwipeDistance = options.minSwipeDistance ?? 50;

  const onTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    setTouchEnd(null); // otherwise the swipe is fired even with usual touch events
    setTouchStart(event.targetTouches[0].clientX);
  };

  const onTouchMove = (event: React.TouchEvent<HTMLElement>) => {
    setTouchEnd(event.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe || isRightSwipe) console.log('swipe', isLeftSwipe ? 'left' : 'right');
    // add your conditional logic here
    if (isLeftSwipe) onLeftSwipe();
    if (isRightSwipe) onRightSwipe();
  };

  return { onTouchStart, onTouchMove, onTouchEnd };
}
