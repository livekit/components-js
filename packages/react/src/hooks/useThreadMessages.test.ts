import { describe, test, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReceivedChatMessage } from '@livekit/components-core';

import { useThreadMessageStore } from './useThreadMessageStore';
import { useThreadMessages } from './useThreadMessages';
import { useSessionMessages } from './useSessionMessages';
import { TEXT_CHAT_ROLE_ATTRIBUTE } from '../text-transport/TextTransport';
import type { UseThreadReturn } from './useThread';
import type { UseSessionReturn } from './useSession';

function agentReply(id: string, message: string): ReceivedChatMessage {
  return {
    id,
    timestamp: Date.now(),
    message,
    attributes: { [TEXT_CHAT_ROLE_ATTRIBUTE]: 'agent' },
  };
}

/** A fake TextTransport whose requestMessageStream yields a single agent reply. */
function makeFakeTextTransport(reply: ReceivedChatMessage) {
  return {
    requestMessageStream: vi.fn(async function* () {
      yield reply;
    }),
    disconnect: vi.fn(async () => {}),
  };
}

/** Build a thread-shaped object backed by a real message store (so reads/writes are exercised). */
function useFakeThread(textTransport: unknown): UseThreadReturn {
  const messageStore = useThreadMessageStore();
  return {
    status: 'ready',
    threadId: undefined,
    textTransport,
    internal: {
      emitter: {},
      tokenSource: {},
      tokenSourceFetch: async () => ({ serverUrl: '', participantToken: '' }),
      messageStore,
      activeCall: null,
      registerCall: () => {},
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
    const userMessages = result.current.messages.filter(
      (m) => (m as ReceivedChatMessage).attributes?.[TEXT_CHAT_ROLE_ATTRIBUTE] === 'user',
    );
    expect(userMessages).toHaveLength(1);
    expect((userMessages[0] as ReceivedChatMessage).message).toBe('hello');
    expect(tt.requestMessageStream).toHaveBeenCalledWith('hello');

    // The streamed agent reply is upserted from the fire-and-forget consumer.
    await waitFor(() => {
      expect(result.current.messages.map((m) => m.id)).toContain('agent-1');
    });
  });
});

describe('useSessionMessages (deprecated alias)', () => {
  test('resolves the thread from session.internal.thread and delegates', async () => {
    const reply = agentReply('agent-2', 'delegated');
    const tt = makeFakeTextTransport(reply);

    const { result } = renderHook(() => {
      const thread = useFakeThread(tt);
      const session = { internal: { thread } } as unknown as UseSessionReturn;
      return useSessionMessages(session);
    });

    await act(async () => {
      await result.current.send('yo');
    });

    expect(tt.requestMessageStream).toHaveBeenCalledWith('yo');
    await waitFor(() => {
      expect(result.current.messages.map((m) => m.id)).toContain('agent-2');
    });
  });
});
