import { describe, test, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReceivedMessage } from '@livekit/components-core';
import { useSessionMessageStore, MessagesEvent } from './useSessionMessageStore';

function msg(id: string, message: string): ReceivedMessage {
  return { id, timestamp: Date.now(), message } as ReceivedMessage;
}

describe('useSessionMessageStore', () => {
  test('upserts and exposes messages', () => {
    const { result } = renderHook(() => useSessionMessageStore());
    act(() => result.current.upsertMessage(msg('a', 'hello')));
    expect(result.current.messages.map((m) => m.id)).toEqual(['a']);
    expect((result.current.messages[0] as { message: string }).message).toBe('hello');
  });

  test('dedups by id and updates in place, preserving first-received order', () => {
    const { result } = renderHook(() => useSessionMessageStore());
    act(() => result.current.upsertMessage(msg('a', 'first')));
    act(() => result.current.upsertMessage(msg('b', 'second')));
    // Update 'a' in place with a NEW object + new content.
    act(() => result.current.upsertMessage(msg('a', 'first-edited')));

    expect(result.current.messages.map((m) => m.id)).toEqual(['a', 'b']); // order unchanged
    expect((result.current.messages[0] as { message: string }).message).toBe('first-edited');
    expect(result.current.messages).toHaveLength(2);
  });

  test('equality short-circuit: re-upserting the same reference does not re-render or re-emit', () => {
    const { result } = renderHook(() => useSessionMessageStore());
    const received: string[] = [];
    result.current.emitter.on(MessagesEvent.MessageReceived, (m) => received.push(m.id));

    act(() => result.current.upsertMessage(msg('a', 'hello')));
    const snapshotRef = result.current.messages;
    // Upsert the exact stored reference back in.
    act(() => result.current.upsertMessages([result.current.messages[0]]));

    expect(result.current.messages).toBe(snapshotRef); // same array reference => no commit
    expect(received).toEqual(['a']); // emitted exactly once
  });

  test('emits MessageReceived exactly once per id', () => {
    const { result } = renderHook(() => useSessionMessageStore());
    const spy = vi.fn();
    result.current.emitter.on(MessagesEvent.MessageReceived, spy);

    act(() => result.current.upsertMessage(msg('a', 'v1')));
    act(() => result.current.upsertMessage(msg('a', 'v2'))); // update-in-place, not a new id
    act(() => result.current.upsertMessage(msg('b', 'v1')));

    expect(spy).toHaveBeenCalledTimes(2); // 'a' and 'b', not three times
  });

  test('clear() empties the store', () => {
    const { result } = renderHook(() => useSessionMessageStore());
    act(() => result.current.upsertMessages([msg('a', 'x'), msg('b', 'y')]));
    expect(result.current.messages).toHaveLength(2);
    act(() => result.current.clear());
    expect(result.current.messages).toEqual([]);
  });

  test('operation callbacks are stable across renders', () => {
    const { result, rerender } = renderHook(() => useSessionMessageStore());
    const first = {
      upsertMessage: result.current.upsertMessage,
      upsertMessages: result.current.upsertMessages,
      clear: result.current.clear,
      emitter: result.current.emitter,
    };
    act(() => result.current.upsertMessage(msg('a', 'x'))); // force a state change + re-render
    rerender();
    expect(result.current.upsertMessage).toBe(first.upsertMessage);
    expect(result.current.upsertMessages).toBe(first.upsertMessages);
    expect(result.current.clear).toBe(first.clear);
    expect(result.current.emitter).toBe(first.emitter);
  });
});
