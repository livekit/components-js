import { describe, test, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReceivedMessage } from '@livekit/components-core';
import { useThreadMessageStore, MessagesEvent } from './useThreadMessageStore';

function msg(id: string, message: string): ReceivedMessage {
  return { id, timestamp: Date.now(), message } as ReceivedMessage;
}

describe('useThreadMessageStore', () => {
  test('upserts and exposes messages', () => {
    const { result } = renderHook(() => useThreadMessageStore());
    act(() => result.current.upsertMessage(msg('a', 'hello')));
    expect(result.current.messages.map((m) => m.id)).toEqual(['a']);
    expect((result.current.messages[0] as { message: string }).message).toBe('hello');
  });

  test('dedups by id and updates in place, preserving first-received order', () => {
    const { result } = renderHook(() => useThreadMessageStore());
    act(() => result.current.upsertMessage(msg('a', 'first')));
    act(() => result.current.upsertMessage(msg('b', 'second')));
    // Update 'a' in place with a NEW object + new content.
    act(() => result.current.upsertMessage(msg('a', 'first-edited')));

    expect(result.current.messages.map((m) => m.id)).toEqual(['a', 'b']); // order unchanged
    expect((result.current.messages[0] as { message: string }).message).toBe('first-edited');
    expect(result.current.messages).toHaveLength(2);
  });

  test('equality short-circuit: re-upserting the same reference does not re-render or re-emit', () => {
    const { result } = renderHook(() => useThreadMessageStore());
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
    const { result } = renderHook(() => useThreadMessageStore());
    const spy = vi.fn();
    result.current.emitter.on(MessagesEvent.MessageReceived, spy);

    act(() => result.current.upsertMessage(msg('a', 'v1')));
    act(() => result.current.upsertMessage(msg('a', 'v2'))); // update-in-place, not a new id
    act(() => result.current.upsertMessage(msg('b', 'v1')));

    expect(spy).toHaveBeenCalledTimes(2); // 'a' and 'b', not three times
  });

  test('clear() empties the store', () => {
    const { result } = renderHook(() => useThreadMessageStore());
    act(() => result.current.upsertMessages([msg('a', 'x'), msg('b', 'y')]));
    expect(result.current.messages).toHaveLength(2);
    act(() => result.current.clear());
    expect(result.current.messages).toEqual([]);
  });

  test('operation callbacks are stable across renders', () => {
    const { result, rerender } = renderHook(() => useThreadMessageStore());
    const first = {
      upsertMessage: result.current.upsertMessage,
      upsertMessages: result.current.upsertMessages,
      prependMessages: result.current.prependMessages,
      replaceMessages: result.current.replaceMessages,
      clear: result.current.clear,
      emitter: result.current.emitter,
    };
    act(() => result.current.upsertMessage(msg('a', 'x'))); // force a state change + re-render
    rerender();
    expect(result.current.upsertMessage).toBe(first.upsertMessage);
    expect(result.current.upsertMessages).toBe(first.upsertMessages);
    expect(result.current.prependMessages).toBe(first.prependMessages);
    expect(result.current.replaceMessages).toBe(first.replaceMessages);
    expect(result.current.clear).toBe(first.clear);
    expect(result.current.emitter).toBe(first.emitter);
  });

  test('prependMessages inserts older messages ahead of existing ones, in their given order', () => {
    const { result } = renderHook(() => useThreadMessageStore());
    act(() => result.current.upsertMessages([msg('live-1', 'x'), msg('live-2', 'y')]));
    act(() => result.current.prependMessages([msg('old-3', 'a'), msg('old-4', 'b')]));
    act(() => result.current.prependMessages([msg('old-1', 'c'), msg('old-2', 'd')]));
    // A live message arriving afterwards still lands at the end.
    act(() => result.current.upsertMessage(msg('live-3', 'z')));

    expect(result.current.messages.map((m) => m.id)).toEqual([
      'old-1',
      'old-2',
      'old-3',
      'old-4',
      'live-1',
      'live-2',
      'live-3',
    ]);
  });

  test('prependMessages updates an already-present id in place, keeping its position', () => {
    const { result } = renderHook(() => useThreadMessageStore());
    act(() => result.current.upsertMessages([msg('a', 'x'), msg('b', 'y')]));
    act(() => result.current.prependMessages([msg('old', 'o'), msg('b', 'y-edited')]));

    expect(result.current.messages.map((m) => m.id)).toEqual(['old', 'a', 'b']);
    expect((result.current.messages[2] as { message: string }).message).toBe('y-edited');
  });

  test('replaceMessages swaps the contents and only emits for never-seen ids', () => {
    const { result } = renderHook(() => useThreadMessageStore());
    const received: string[] = [];
    result.current.emitter.on(MessagesEvent.MessageReceived, (m) => received.push(m.id));

    act(() => result.current.upsertMessages([msg('a', 'x'), msg('b', 'y')]));
    act(() => result.current.replaceMessages([msg('b', 'y2'), msg('c', 'z'), msg('a', 'x2')]));

    expect(result.current.messages.map((m) => m.id)).toEqual(['b', 'c', 'a']);
    expect(received).toEqual(['a', 'b', 'c']);

    act(() => result.current.replaceMessages([]));
    expect(result.current.messages).toEqual([]);
  });
});
