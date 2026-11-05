import { describe, test, expect } from 'vitest';
import * as React from 'react';
import { renderHook } from '@testing-library/react';
import { ConnectionState, TokenSourceConfigurable } from 'livekit-client';

import { useThread } from './useThread';
import { useSession } from './useSession';
import { ThreadProvider } from '../components/ThreadProvider';

describe('useSession (attached form)', () => {
  test('attaches to an explicitly passed thread rather than creating one', () => {
    // A non-TokenSourceConfigurable value is treated as a fixed source; no fetch happens here.
    const { result } = renderHook(() => {
      const thread = useThread({} as never, {});
      const session = useSession(thread, {});
      return { thread, session };
    });

    // The session reuses the passed thread (its back-reference points at the same instance).
    expect(result.current.session.internal.thread).toBe(result.current.thread);
    expect(result.current.session.connectionState).toBe(ConnectionState.Disconnected);
    expect(result.current.session.isConnected).toBe(false);
  });

  test('resolves the thread from a Thread provider when none is passed', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => {
      const thread = useThread({} as never, {});
      return React.createElement(ThreadProvider, { thread }, children);
    };

    const { result } = renderHook(() => useSession(), { wrapper });

    expect(result.current.internal.thread).toBeDefined();
    expect(result.current.connectionState).toBe(ConnectionState.Disconnected);
  });
});

describe('useSession (argument-form guard)', () => {
  test('throws if the argument form changes between renders', () => {
    // A token source instance (without running its constructor) to flip the hook into the legacy form.
    const bogusTokenSource = Object.create(TokenSourceConfigurable.prototype);

    const wrapper = ({ children }: { children: React.ReactNode }) => {
      const thread = useThread({} as never, {});
      return React.createElement(ThreadProvider, { thread }, children);
    };

    const { rerender } = renderHook(
      ({ legacy }: { legacy: boolean }) =>
        // first render: attached (context thread); switching to a token source is the illegal change.
        useSession(legacy ? (bogusTokenSource as never) : undefined),
      { initialProps: { legacy: false }, wrapper },
    );

    expect(() => rerender({ legacy: true })).toThrow(/argument form must not change/);
  });
});
