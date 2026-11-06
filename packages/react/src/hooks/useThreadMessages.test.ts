import * as React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReceivedChatMessage } from '@livekit/components-core';

import { useThreadMessageStore } from './useThreadMessageStore';
import { useThreadMessages } from './useThreadMessages';
import type { UseThreadReturn } from './useThread';

function agentReply(id: string, message: string): ReceivedChatMessage {
  return {
    id,
    timestamp: Date.now(),
    message,
    origin: 'agent',
    role: 'assistant',
  };
}

/** A fake TextTransport whose requestMessageStream yields a single agent reply. */
function makeFakeTextTransport(reply: ReceivedChatMessage) {
  return {
    requestMessageStream: vi.fn(async function* () {
      yield { kind: 'message', message: reply };
    }),
    disconnect: vi.fn(async () => {}),
  };
}

/** Build a thread-shaped object backed by a real message store (so reads/writes are exercised) and a
 * real text-agent-state so send()'s idle → thinking → typing → idle transitions are observable. */
function useFakeThread(textTransport: unknown): UseThreadReturn {
  const messageStore = useThreadMessageStore();
  const [textAgentState, setTextAgentState] = React.useState<
    'idle' | 'thinking' | 'typing' | 'input-required'
  >('idle');
  const [textAgentFailureReason, setTextAgentFailureReason] = React.useState<string | null>(null);
  return {
    status: 'ready',
    threadId: null,
    textTransport,
    internal: {
      emitter: {},
      tokenSource: {},
      tokenSourceFetch: async () => ({ serverUrl: '', participantToken: '' }),
      messageStore,
      room: {},
      activeCall: null,
      registerCall: () => {},
      textAgentState,
      setTextAgentState,
      textAgentFailureReason,
      setTextAgentFailureReason,
    },
  } as unknown as UseThreadReturn;
}

describe('useThreadMessages', () => {
  test('reads the thread store and sends via the transport', async () => {
    const reply = agentReply('agent-1', 'hi there');
    const tt = makeFakeTextTransport(reply);

    const { result } = renderHook(() => {
      const thread = useFakeThread(tt);
      return useThreadMessages(thread);
    });

    expect(result.current.messages).toEqual([]);

    await act(async () => {
      await result.current.send('hello');
    });

    // The user's message is upserted immediately.
    const userMessages = result.current.messages.filter((m) => m.origin === 'user');
    expect(userMessages).toHaveLength(1);
    expect((userMessages[0] as ReceivedChatMessage).message).toBe('hello');
    expect(tt.requestMessageStream).toHaveBeenCalledWith('hello');

    // The streamed agent reply is upserted from the fire-and-forget consumer.
    await waitFor(() => {
      expect(result.current.messages.map((m) => m.id)).toContain('agent-1');
    });
  });

  test('send() drives the thread text-agent state: thinking → typing → idle', async () => {
    // A gated transport: the stream blocks before its first chunk and before completing, so each
    // transition can be observed deterministically.
    let releaseFirstChunk!: () => void;
    const firstChunkGate = new Promise<void>((resolve) => {
      releaseFirstChunk = resolve;
    });
    let releaseEnd!: () => void;
    const endGate = new Promise<void>((resolve) => {
      releaseEnd = resolve;
    });
    const tt = {
      requestMessageStream: vi.fn(async function* () {
        await firstChunkGate;
        yield { kind: 'message', message: agentReply('gated-1', 'streaming…') };
        await endGate;
      }),
      disconnect: vi.fn(async () => {}),
    };

    const { result } = renderHook(() => {
      const thread = useFakeThread(tt);
      const messages = useThreadMessages(thread);
      return { thread, messages };
    });

    expect(result.current.thread.internal.textAgentState).toBe('idle');

    // The server has accepted the send, but no chunk has streamed yet → thinking.
    await act(async () => {
      await result.current.messages.send('hi');
    });
    expect(result.current.thread.internal.textAgentState).toBe('thinking');

    // First chunk streams back → typing.
    await act(async () => {
      releaseFirstChunk();
    });
    await waitFor(() => expect(result.current.thread.internal.textAgentState).toBe('typing'));

    // Stream completes → idle.
    await act(async () => {
      releaseEnd();
    });
    await waitFor(() => expect(result.current.thread.internal.textAgentState).toBe('idle'));
  });

  test('a failed task state surfaces as a text failure reason (and settles to idle)', async () => {
    const tt = {
      requestMessageStream: vi.fn(async function* () {
        yield { kind: 'taskState', state: 'failed' };
      }),
      disconnect: vi.fn(async () => {}),
    };

    const { result } = renderHook(() => {
      const thread = useFakeThread(tt);
      const messages = useThreadMessages(thread);
      return { thread, messages };
    });

    await act(async () => {
      await result.current.messages.send('hi');
    });

    await waitFor(() =>
      expect(result.current.thread.internal.textAgentFailureReason).not.toBeNull(),
    );
    expect(result.current.thread.internal.textAgentState).toBe('idle');
  });

  test('an input-required task state settles the turn to input-required', async () => {
    const tt = {
      requestMessageStream: vi.fn(async function* () {
        yield { kind: 'message', message: agentReply('q-1', 'what is your name?') };
        yield { kind: 'taskState', state: 'input-required' };
      }),
      disconnect: vi.fn(async () => {}),
    };

    const { result } = renderHook(() => {
      const thread = useFakeThread(tt);
      const messages = useThreadMessages(thread);
      return { thread, messages };
    });

    await act(async () => {
      await result.current.messages.send('hi');
    });

    await waitFor(() =>
      expect(result.current.thread.internal.textAgentState).toBe('input-required'),
    );
    expect(result.current.thread.internal.textAgentFailureReason).toBeNull();
  });
});
