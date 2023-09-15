import { describe, test, expect, assertType } from 'vitest';
import type { LayoutContextType } from './layout-context';
import { useMegaLayoutContext } from './layout-context';
import { renderHook } from '@testing-library/react';
import { LayoutContextProvider } from '../components';
import * as React from 'react';

function ContextWrapper({ children }: { children: React.ReactNode }) {
  const providedContext = {
    pin: { dispatch: 'provided_context', state: 'provided_context' },
    widget: { dispatch: 'provided_context', state: 'provided_context' },
  } as unknown as LayoutContextType;

  return <LayoutContextProvider value={providedContext}>{children}</LayoutContextProvider>;
}

describe('Test the return types of useLayoutContext() based on the inputs:', () => {
  test('Input (undefined) -> with context -> return context.', () => {
    const { result } = renderHook(
      () => {
        return useMegaLayoutContext();
      },
      { wrapper: ContextWrapper },
    );
    expect(result.current).toBeDefined();
    expect(result.current?.pin.dispatch).toBe('provided_context');
    assertType<LayoutContextType>(result.current);
  });

  test('Input (undefined) -> without context -> throw missing context error.', () => {
    let finalError = undefined;
    let finalResult: unknown;
    try {
      const { result } = renderHook(() => {
        return useMegaLayoutContext();
      });
      finalResult = result;
      assertType<LayoutContextType>(result.current);
    } catch (error: any) {
      finalError = error.message;
    }
    expect(finalResult).toBeUndefined();
    expect(finalError).toContain(
      'Tried to access LayoutContext context outside a LayoutContextProvider provider.',
    );
  });

  test('Input ({ maybeUndefined: true }) -> with context -> return context.', () => {
    const { result } = renderHook(
      () => {
        return useMegaLayoutContext({ maybeUndefined: true });
      },
      { wrapper: ContextWrapper },
    );
    expect(result.current).toBeDefined();
    expect(result.current?.pin.dispatch).toBe('provided_context');
    assertType<LayoutContextType | undefined>(result.current);
  });
  test('Input ({ maybeUndefined: true }) -> with no context -> return undefined.', () => {
    const { result } = renderHook(() => {
      return useMegaLayoutContext({ maybeUndefined: true });
    });
    expect(result.current).toBeUndefined();
  });

  test('Input (contextAsAttribute) -> with context -> return contextA.', () => {
    const contextAsAttribute = {
      pin: { dispatch: 'attribute_context', state: 'attribute_context' },
      widget: { dispatch: 'attribute_context', state: 'attribute_context' },
    } as unknown as LayoutContextType;

    const { result } = renderHook(
      () => {
        return useMegaLayoutContext(contextAsAttribute);
      },
      { wrapper: ContextWrapper },
    );
    expect(result.current).toBeDefined();
    expect(result.current.pin.dispatch).toBe('attribute_context');
    expect(result.current.widget.dispatch).toBe('attribute_context');
    assertType<LayoutContextType>(result.current);
  });
});
