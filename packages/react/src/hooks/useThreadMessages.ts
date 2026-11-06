import * as React from 'react';
import type TypedEventEmitter from 'typed-emitter';
import { SendTextOptions } from 'livekit-client';
import { ReceivedMessage, ReceivedChatMessage, log } from '@livekit/components-core';

import { UseThreadReturn } from './useThread';
import type { MessagesCallbacks } from './useThreadMessageStore';
import { useMaybeSessionContext, useMaybeThreadContext } from '../context';

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
  // The shared text-mode response lifecycle, read by `useAgent` (idle → thinking → typing → idle), plus
  // the text-turn failure signal (folded into `useAgent().failureReasons`).
  const { setTextAgentState, setTextAgentFailureReason } = resolvedThread.internal;

  const [isSending, setIsSending] = React.useState(false);

  const send = React.useCallback(
    async (message: string, _options?: SendTextOptions): Promise<ReceivedChatMessage> => {
      const initialUserMessage: ReceivedChatMessage = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        message,
        origin: 'user',
        role: 'user',
      };
      upsertMessage(initialUserMessage);

      // Starting a new turn clears any prior failure, so a text failure is not terminal.
      setTextAgentFailureReason(null);

      // The in-flight POST stays `idle`; only once the server has accepted the send (the request
      // resolves) do we move to `thinking`. `try/finally` guarantees `isSending` is reset if the
      // request throws; a POST failure surfaces as a failed turn (and still propagates to the caller).
      setIsSending(true);
      let stream: Awaited<ReturnType<typeof textTransport.requestMessageStream>>;
      try {
        stream = await textTransport.requestMessageStream(message);
      } catch (err) {
        setTextAgentState('idle');
        setTextAgentFailureReason(err instanceof Error ? err.message : 'Failed to send message.');
        throw err;
      } finally {
        setIsSending(false);
      }
      setTextAgentState('thinking');

      (async () => {
        let sawChunk = false;
        // The turn's resting state once the stream closes: `idle`, unless it paused for input.
        let pendingState: 'idle' | 'input-required' = 'idle';
        let failureReason: string | null = null;
        try {
          for await (const item of stream) {
            if (item.kind === 'taskState') {
              if (item.state === 'input-required' || item.state === 'auth-required') {
                pendingState = 'input-required';
              } else if (item.state === 'failed') {
                failureReason = 'The agent was unable to complete the request.';
              }
              // `working` / `completed` / `canceled` need no resting-state change here.
              continue;
            }

            // The first streamed message means the response has started coming back.
            if (!sawChunk) {
              setTextAgentState('typing');
              sawChunk = true;
            }
            upsertMessage(item.message);
          }
        } catch (err) {
          failureReason = err instanceof Error ? err.message : 'The message stream failed.';
          log.warn('useThreadMessages: text message stream failed', err);
        } finally {
          if (failureReason) {
            setTextAgentFailureReason(failureReason);
            setTextAgentState('idle');
          } else {
            // Fully streamed (or paused awaiting input) — settle to the resting state.
            setTextAgentState(pendingState);
          }
        }
      })();

      return initialUserMessage;
    },
    [textTransport, upsertMessage, setTextAgentState, setTextAgentFailureReason],
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
