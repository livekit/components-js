import { fireEvent, renderHook } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { useSwipe } from './useSwipe';

describe('useSwipe', () => {
  test.each([
    { start: 0, end: 100, direction: 'right' },
    { start: 100, end: 0, direction: 'left' },
    { start: 20, end: 120, direction: 'right' },
    { start: 120, end: 20, direction: 'left' },
  ])('detects a $direction swipe from $start to $end', ({ start, end, direction }) => {
    const element = document.createElement('div');
    const onLeftSwipe = vi.fn();
    const onRightSwipe = vi.fn();
    const { unmount } = renderHook(() =>
      useSwipe({ current: element }, { onLeftSwipe, onRightSwipe }),
    );

    fireEvent.touchStart(element, { targetTouches: [{ clientX: start }] });
    fireEvent.touchMove(element, { targetTouches: [{ clientX: end }] });
    fireEvent.touchEnd(element);

    expect(onLeftSwipe).toHaveBeenCalledTimes(direction === 'left' ? 1 : 0);
    expect(onRightSwipe).toHaveBeenCalledTimes(direction === 'right' ? 1 : 0);
    unmount();
  });

  test('ignores taps and movement that does not exceed the configured distance', () => {
    const element = document.createElement('div');
    const onLeftSwipe = vi.fn();
    const onRightSwipe = vi.fn();
    const { unmount } = renderHook(() =>
      useSwipe({ current: element }, { minSwipeDistance: 100, onLeftSwipe, onRightSwipe }),
    );

    fireEvent.touchEnd(element);
    fireEvent.touchStart(element, { targetTouches: [{ clientX: 0 }] });
    fireEvent.touchEnd(element);
    fireEvent.touchStart(element, { targetTouches: [{ clientX: 0 }] });
    fireEvent.touchMove(element, { targetTouches: [{ clientX: 50 }] });
    fireEvent.touchEnd(element);
    fireEvent.touchStart(element, { targetTouches: [{ clientX: 0 }] });
    fireEvent.touchMove(element, { targetTouches: [{ clientX: 100 }] });
    fireEvent.touchEnd(element);

    expect(onLeftSwipe).not.toHaveBeenCalled();
    expect(onRightSwipe).not.toHaveBeenCalled();
    unmount();
  });
});
