import type { LayoutContextType } from './layout-context';
import { useTestLayoutContext } from './layout-context';
import { renderHook } from '@testing-library/react';
import { describe, test, assertType } from 'vitest';

describe('Test the return types of useLayoutContext() based on the inputs:', () => {
  test('useTestLayoutContext() returns undefined |', () => {
    const { result } = renderHook(() => {
      return useTestLayoutContext();
    });
    assertType<LayoutContextType | undefined>(result.current);
  });
  test('useTestLayoutContext()', () => {
    const { result } = renderHook(() => {
      return useTestLayoutContext({ ensure: true });
    });
    assertType<LayoutContextType>(result.current);
  });
});
