import * as React from 'react';
import type TypedEventEmitter from 'typed-emitter';
import { SendTextOptions } from 'livekit-client';
import { ReceivedMessage, ReceivedChatMessage, log } from '@livekit/components-core';

import { UseThreadReturn } from './useThread';
import type { MessagesCallbacks } from './useThreadMessageStore';
import type { ThreadHistoryRefreshOptions } from './useThreadHistory';
import { useMaybeSessionContext, useMaybeThreadContext } from '../context';

type UseThreadMessagesCommon = {
  /**
   * The thread's transcript, oldest first: loaded history plus everything sent and received live. Every
   * kind is included (text, transcripts, tool calls, handoffs, config updates, and system/developer
   * messages); filter on `type` / `origin` to show a subset.
   */
  messages: Array<ReceivedMessage>;

  /** Is a send operation currently in progress? */
  isSending: boolean;

  send: (message: string, options?: SendTextOptions) => Promise<ReceivedChatMessage>;

  /**
   * Load the next older page of history and insert it ahead of `messages`. Does nothing unless `status` is
   * `ready` or `error` and `hasOlder` is true; after a failed `loadOlder`, calling it again retries.
   */
  loadOlder: () => Promise<void>;

  /**
   * Re-fetch history from the server and replace `messages` with it. `mode: 'loaded'` (the default)
   * re-fetches as many pages as are loaded; `mode: 'latest'` resets to just the latest page. `messages`
   * stays as-is until the refresh completes, and is untouched if it fails.
   */
  refresh: (options?: ThreadHistoryRefreshOptions) => Promise<void>;

  internal: {
    emitter: TypedEventEmitter<MessagesCallbacks>;
  };
};

/** History fetching is turned off (the thread's `history.pageSize` is 0). */
type UseThreadMessagesDisabled = UseThreadMessagesCommon & {
  status: 'disabled';
  hasOlder: false;
  error: null;
};

/**
 * No history has been fetched: the thread has no id yet (it is created by the first send), or its
 * first page is about to be requested.
 */
type UseThreadMessagesIdle = UseThreadMessagesCommon & {
  status: 'idle';
  hasOlder: false;
  error: null;
};

/** The latest page of history is being fetched; `messages` holds only what arrived live so far. */
type UseThreadMessagesLoading = UseThreadMessagesCommon & {
  status: 'loading';
  hasOlder: false;
  error: null;
};

/** History is loaded. `hasOlder` says whether `loadOlder` can page further back. */
type UseThreadMessagesReady = UseThreadMessagesCommon & {
  status: 'ready';
  hasOlder: boolean;
  error: null;
};

/** An older page of history is being fetched (after `loadOlder`). */
type UseThreadMessagesLoadingOlder = UseThreadMessagesCommon & {
  status: 'loading-older';
  hasOlder: true;
  error: null;
};

/** History is being re-fetched (after `refresh`); `messages` keeps showing the current transcript. */
type UseThreadMessagesRefreshing = UseThreadMessagesCommon & {
  status: 'refreshing';
  hasOlder: boolean;
  error: null;
};

/**
 * The last history request failed. `messages` keeps whatever had loaded; `hasOlder` is kept, so
 * `loadOlder` retries a failed older page and `refresh` retries a failed first page.
 */
type UseThreadMessagesError = UseThreadMessagesCommon & {
  status: 'error';
  hasOlder: boolean;
  error: Error;
};

/** @beta */
export type UseThreadMessagesReturn =
  | UseThreadMessagesDisabled
  | UseThreadMessagesIdle
  | UseThreadMessagesLoading
  | UseThreadMessagesReady
  | UseThreadMessagesLoadingOlder
  | UseThreadMessagesRefreshing
  | UseThreadMessagesError;

/**
 * A thread's messages: chat messages sent and received over the thread's TextTransport (A2A/HTTP), plus
 * any voice transcriptions an attached call has written into the shared store. Chat is never sent over
 * the data channel. All messages live in the thread's shared message store so they persist for the life
 * of the conversation.
 *
 * History is fetched lazily: the first `useThreadMessages` to mount for a thread loads its latest page
 * (`useThread` alone never fetches it). Older pages load on demand with `loadOlder`. The paging state
 * is shared by every `useThreadMessages` of the thread, configured by `useThread`'s `history` option.
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
  const { messages: storeMessages, upsertMessage, emitter } = resolvedThread.internal.messageStore;
  // The shared text-mode response lifecycle, read by `useAgent` (idle → thinking → typing → idle), plus
  // the text-turn failure signal (folded into `useAgent().failureReasons`).
  const { setTextAgentState, setTextAgentFailureReason, history } = resolvedThread.internal;
  const { ensureLoaded, loadOlder, refresh } = history;

  // Load the latest page of history once this thread has an id and nothing has been fetched. It no-ops
  // otherwise, and concurrent consumers share the one request.
  React.useEffect(() => {
    void ensureLoaded();
  }, [ensureLoaded, history.status, resolvedThread.threadId]);

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

  return React.useMemo((): UseThreadMessagesReturn => {
    const common: UseThreadMessagesCommon = {
      messages: storeMessages,
      send,
      isSending,
      loadOlder,
      refresh,
      internal: { emitter },
    };
    switch (history.status) {
      case 'disabled':
      case 'idle':
      case 'loading':
        return { ...common, status: history.status, hasOlder: false, error: null };
      case 'ready':
      case 'refreshing':
        return {
          ...common,
          status: history.status,
          hasOlder: history.olderCursor !== null,
          error: null,
        };
      case 'loading-older':
        return { ...common, status: 'loading-older', hasOlder: true, error: null };
      case 'error':
        return {
          ...common,
          status: 'error',
          hasOlder: history.olderCursor !== null,
          error: history.error,
        };
    }
  }, [
    storeMessages,
    send,
    isSending,
    loadOlder,
    refresh,
    emitter,
    history.status,
    history.olderCursor,
    history.error,
  ]);
}
