import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { DEFAULT_AGENT_CONNECT_TIMEOUT_MILLISECONDS, useAgentTimeoutIdStore } from './useAgent';

const TIMEOUT_MS = DEFAULT_AGENT_CONNECT_TIMEOUT_MILLISECONDS;

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('useAgentTimeoutIdStore', () => {
  test('ending a session early clears its timeout so it cannot fail the next session', () => {
    const { result } = renderHook(() => useAgentTimeoutIdStore());

    // Like useAgent's effect, hold on to the callbacks from the first render rather than reading
    // the latest ones off result.current.
    const { startAgentTimeout, clearAgentTimeout } = result.current;

    // Start a session, end it after 5s, then start a new one at 6s.
    act(() => startAgentTimeout(TIMEOUT_MS));
    act(() => vi.advanceTimersByTime(5_000));
    act(() => clearAgentTimeout());
    act(() => vi.advanceTimersByTime(1_000));
    act(() => startAgentTimeout(TIMEOUT_MS));

    // When the first session's timer would have fired, nothing should have failed.
    act(() => vi.advanceTimersByTime(TIMEOUT_MS - 6_000 + 1));
    expect(result.current.agentTimeoutFailureReason).toBeNull();

    // The second session's own timer should fire 6s later.
    act(() => vi.advanceTimersByTime(6_000));
    expect(result.current.agentTimeoutFailureReason).toBe('Agent did not join the room.');
  });

  test('start and clear callbacks keep the same identity across renders', () => {
    const { result } = renderHook(() => useAgentTimeoutIdStore());
    const { startAgentTimeout, clearAgentTimeout } = result.current;

    act(() => result.current.startAgentTimeout(TIMEOUT_MS));

    expect(result.current.startAgentTimeout).toBe(startAgentTimeout);
    expect(result.current.clearAgentTimeout).toBe(clearAgentTimeout);
  });
});
