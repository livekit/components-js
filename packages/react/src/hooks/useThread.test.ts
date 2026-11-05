import { describe, test, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useThread, isUseThreadReturn, type ActiveCall } from './useThread';
import { isUseSessionReturn } from './useSession';

describe('useThread', () => {
  test('with no threadId it settles to ready and exposes a store + transport', () => {
    // A non-TokenSourceConfigurable value is treated as a fixed source; no fetch happens here.
    const { result } = renderHook(() => useThread({} as never, {}));

    expect(result.current.status).toBe('ready');
    expect(result.current.threadId).toBeNull();
    expect(result.current.textTransport).toBeDefined();
    expect(result.current.internal.messageStore).toBeDefined();
    // The thread always exposes a canonical (placeholder) room and an idle text-agent state.
    expect(result.current.internal.room).toBeDefined();
    expect(result.current.internal.textAgentState).toBe('idle');
    expect(typeof result.current.internal.setTextAgentState).toBe('function');
    expect(result.current.internal.activeCall).toBeNull();
    expect(typeof result.current.internal.registerCall).toBe('function');
  });

  test('registerCall updates the active call exposed on internal', () => {
    const { result } = renderHook(() => useThread({} as never, {}));

    const fakeCall = {
      connectionState: 'disconnected',
      internal: {},
    } as unknown as ActiveCall;

    act(() => result.current.internal.registerCall(fakeCall));
    expect(result.current.internal.activeCall).toBe(fakeCall);

    act(() => result.current.internal.registerCall(null));
    expect(result.current.internal.activeCall).toBeNull();
  });

  test('setTextAgentState updates the shared text-agent state on internal', () => {
    const { result } = renderHook(() => useThread({} as never, {}));

    expect(result.current.internal.textAgentState).toBe('idle');
    act(() => result.current.internal.setTextAgentState('thinking'));
    expect(result.current.internal.textAgentState).toBe('thinking');
    act(() => result.current.internal.setTextAgentState('typing'));
    expect(result.current.internal.textAgentState).toBe('typing');
    act(() => result.current.internal.setTextAgentState('idle'));
    expect(result.current.internal.textAgentState).toBe('idle');
  });
});

describe('thread/session type guards', () => {
  const threadish = { status: 'ready', textTransport: {}, internal: {} };
  const sessionish = { room: {}, connectionState: 'disconnected', internal: {} };

  test('isUseThreadReturn matches a thread and rejects a session', () => {
    expect(isUseThreadReturn(threadish)).toBe(true);
    expect(isUseThreadReturn(sessionish)).toBe(false); // has a room
    expect(isUseThreadReturn(undefined)).toBe(false);
    expect(isUseThreadReturn({})).toBe(false);
  });

  test('isUseSessionReturn matches a session and rejects a thread', () => {
    expect(isUseSessionReturn(sessionish)).toBe(true);
    expect(isUseSessionReturn(threadish)).toBe(false); // no room/connectionState
    expect(isUseSessionReturn(undefined)).toBe(false);
  });
});
