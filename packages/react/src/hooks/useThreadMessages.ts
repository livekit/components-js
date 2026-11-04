import * as React from 'react';
import type TypedEventEmitter from 'typed-emitter';
import { SendTextOptions } from 'livekit-client';
import { ReceivedMessage, ReceivedChatMessage, log } from '@livekit/components-core';

import { UseThreadReturn } from './useThread';
import type { MessagesCallbacks } from './useThreadMessageStore';
import { useMaybeSessionContext, useMaybeThreadContext } from '../context';
import { TEXT_CHAT_ROLE_ATTRIBUTE } from '../text-transport/TextTransport';

/** @beta */
export type UseThreadMessagesReturn = {
  messages: Array<ReceivedMessage>;

  /** Is a send operation currently in progress? */
  isSending: boolean;

  send: (message: string, options?: SendTextOptions) => Promise<ReceivedChatMessage>;

  internal: {
    emitter: TypedEventEmitter<MessagesCallbacks>;
  };
};

/**
 * A thread's messages: chat messages sent and received over the thread's TextTransport (A2A/HTTP), plus
 * any voice transcriptions an attached call has written into the shared store. Chat is never sent over
 * the data channel. All messages live in the thread's shared message store so they persist for the life
 * of the conversation.
 *
 * The thread is resolved from the argument, or from a Thread or Session provider in context.
 * @beta
 */
export function useThreadMessages(thread?: UseThreadReturn): UseThreadMessagesReturn {
  const threadFromContext = useMaybeThreadContext();
  const sessionFromContext = useMaybeSessionContext();

  const resolvedThread: UseThreadReturn | undefined =
    thread ?? threadFromContext ?? sessionFromContext?.internal.thread;
  if (!resolvedThread) {
    throw new Error(
      'useThreadMessages: no thread available. Render inside a Thread or Session provider, or pass a thread explicitly.',
    );
  }

  const { textTransport } = resolvedThread;
  // Destructure the stable store operations: the store object's identity changes whenever messages
  // change, so depending on it directly would re-run effects / re-create callbacks on every message.
  const {
    messages: storeMessages,
    upsertMessage,
    emitter,
  } = resolvedThread.internal.messageStore;
  // The shared text-mode response lifecycle, read by `useAgent` (idle → thinking → typing → idle).
  const { setTextAgentState } = resolvedThread.internal;

  const [isSending, setIsSending] = React.useState(false);

  const send = React.useCallback(
    async (message: string, _options?: SendTextOptions): Promise<ReceivedChatMessage> => {
      const initialUserMessage: ReceivedChatMessage = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        message,
        attributes: { [TEXT_CHAT_ROLE_ATTRIBUTE]: 'user' },
      };
      upsertMessage(initialUserMessage);

      // The in-flight POST stays `idle`; only once the server has accepted the send (the request
      // resolves) do we move to `thinking`. `try/finally` also guarantees `isSending` is reset if the
      // request throws.
      setIsSending(true);
      let stream: Awaited<ReturnType<typeof textTransport.requestMessageStream>>;
      try {
        stream = await textTransport.requestMessageStream(message);
      } finally {
        setIsSending(false);
      }
      setTextAgentState('thinking');

      (async () => {
        let sawChunk = false;
        try {
          for await (const streamedMessage of stream) {
            // The first streamed chunk means the response has started coming back.
            if (!sawChunk) {
              setTextAgentState('typing');
              sawChunk = true;
            }
            upsertMessage(streamedMessage);
          }
        } catch (err) {
          // FIXME: figure out how to handle errors here, should these somehow put the agent into an
          // errored state?
          log.warn('useThreadMessages: text message stream failed', err);
        } finally {
          // The response is fully streamed (or failed) — back to idle.
          setTextAgentState('idle');
        }
      })();

      return initialUserMessage;
    },
    [textTransport, upsertMessage, setTextAgentState],
  );

  return React.useMemo(
    () => ({
      messages: storeMessages,
      send,
      isSending,
      internal: { emitter },
    }),
    [storeMessages, emitter, send, isSending],
  );
}
