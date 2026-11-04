import { describe, test, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useThread } from './useThread';
import { useAgent } from './useAgent';

describe('useAgent (call-less / text-mode thread)', () => {
  test('a thread with no active call settles to idle and is not connected', () => {
    const { result } = renderHook(() => {
      // A non-TokenSourceConfigurable value is treated as a fixed source; no fetch happens here.
      const thread = useThread({} as never, {});
      const agent = useAgent(thread);
      return { thread, agent };
    });

    expect(result.current.agent.state).toBe('idle');
    expect(result.current.agent.isConnected).toBe(false);
    expect(result.current.agent.isPending).toBe(false);
    expect(result.current.agent.failureReasons).toBeNull();
  });

  test('reflects the thread text-agent lifecycle (thinking / typing)', () => {
    const { result } = renderHook(() => {
      const thread = useThread({} as never, {});
      const agent = useAgent(thread);
      return { thread, agent };
    });

    act(() => result.current.thread.internal.setTextAgentState('thinking'));
    expect(result.current.agent.state).toBe('thinking');
    expect(result.current.agent.isConnected).toBe(false);

    act(() => result.current.thread.internal.setTextAgentState('typing'));
    expect(result.current.agent.state).toBe('typing');
    expect(result.current.agent.isConnected).toBe(false);

    act(() => result.current.thread.internal.setTextAgentState('idle'));
    expect(result.current.agent.state).toBe('idle');
  });

  test('throws when no thread (and no session) is available', () => {
    expect(() => renderHook(() => useAgent())).toThrow(/No thread/);
  });
});
