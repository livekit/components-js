import { act, cleanup, renderHook } from '@testing-library/react';
import * as React from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useAgentTimeoutIdStore } from './useAgent';

const TIMEOUT_MS = 20_000;

/** Mirrors how useAgent drives the agent timeout store from the session connection state. */
function useAgentTimeoutHarness(isSessionDisconnected: boolean) {
  const store = useAgentTimeoutIdStore();
  const { startAgentTimeout, clearAgentTimeout } = store;

  React.useEffect(() => {
    if (isSessionDisconnected) {
      return;
    }

    startAgentTimeout(TIMEOUT_MS);
    return () => {
      clearAgentTimeout();
    };
    // Intentionally matches useAgent's dependency list, which omits the store callbacks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSessionDisconnected]);

  return store;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('useAgentTimeoutIdStore', () => {
  test('ending a session early clears its timeout so it cannot fail the next session', () => {
    const { result, rerender } = renderHook(
      ({ disconnected }) => useAgentTimeoutHarness(disconnected),
      { initialProps: { disconnected: false } },
    );

    // End the first session after 5s, then start a new one at 6s.
    act(() => vi.advanceTimersByTime(5_000));
    rerender({ disconnected: true });
    act(() => vi.advanceTimersByTime(1_000));
    rerender({ disconnected: false });

    // At 20s the first session's timer would have fired.
    act(() => vi.advanceTimersByTime(14_000 + 1));
    expect(result.current.agentTimeoutFailureReason).toBeNull();

    // The second session's own timer should fire at 26s.
    act(() => vi.advanceTimersByTime(6_000));
    expect(result.current.agentTimeoutFailureReason).toBe('Agent did not join the room.');
  });

  test('clearAgentTimeout from an earlier render still clears the active timer', () => {
    const { result } = renderHook(() => useAgentTimeoutIdStore());
    const staleClearAgentTimeout = result.current.clearAgentTimeout;

    act(() => result.current.startAgentTimeout(TIMEOUT_MS));
    act(() => staleClearAgentTimeout());

    act(() => vi.advanceTimersByTime(TIMEOUT_MS + 1));
    expect(result.current.agentTimeoutFailureReason).toBeNull();
  });

  test('start and clear callbacks keep the same identity across renders', () => {
    const { result } = renderHook(() => useAgentTimeoutIdStore());
    const { startAgentTimeout, clearAgentTimeout } = result.current;

    act(() => result.current.startAgentTimeout(TIMEOUT_MS));

    expect(result.current.startAgentTimeout).toBe(startAgentTimeout);
    expect(result.current.clearAgentTimeout).toBe(clearAgentTimeout);
  });
});
