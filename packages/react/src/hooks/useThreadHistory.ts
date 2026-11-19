import * as React from 'react';
import type { ReceivedMessage } from '@livekit/components-core';

import type { TextTransport } from '../text-transport/TextTransport';
import type { ThreadMessageStore } from './useThreadMessageStore';

/** The default number of history items fetched per page (matches the Rust SDK). */
export const DEFAULT_THREAD_HISTORY_PAGE_SIZE = 100;

/**
 * The paging state of a thread's history, shared by every `useThreadMessages` of the thread. `olderCursor`
 * is the cursor of the next older page (null when there is none, or nothing has loaded yet).
 * @internal
 */
export type ThreadHistoryState =
  | { status: 'disabled'; olderCursor: null; error: null }
  | { status: 'idle'; olderCursor: null; error: null }
  | { status: 'loading'; olderCursor: null; error: null }
  | { status: 'ready'; olderCursor: string | null; error: null }
  | { status: 'loading-older'; olderCursor: string; error: null }
  | { status: 'refreshing'; olderCursor: string | null; error: null }
  | { status: 'error'; olderCursor: string | null; error: Error };

/** @beta */
export type ThreadHistoryRefreshOptions = {
  /**
   * `loaded` (the default) re-fetches as many pages as are currently loaded; `latest` resets paging and
   * re-fetches only the latest page. Either way the transcript is replaced by what the server returns.
   */
  mode?: 'loaded' | 'latest';
};

/**
 * A thread's history state plus the operations that drive it. Fetching is lazy: nothing is requested
 * until a consumer (`useThreadMessages`) calls `ensureLoaded`.
 * @internal
 */
export type ThreadHistory = ThreadHistoryState & {
  /** Load the latest page, if this thread's history hasn't been loaded yet. Concurrent calls share one request. */
  ensureLoaded: () => Promise<void>;
  /** Load the next older page and insert it ahead of the transcript. */
  loadOlder: () => Promise<void>;
  /** Re-fetch history and replace the transcript with it. */
  refresh: (options?: ThreadHistoryRefreshOptions) => Promise<void>;
  /**
   * Tell the history that the transport just created this thread (on the first send): there is nothing
   * older on the server, so it is marked loaded without a request. Called by `useThread`.
   */
  onThreadStarted: (threadId: string) => void;
};

type UseThreadHistoryOptions = {
  threadId: string | null;
  textTransport: TextTransport;
  messageStore: Pick<ThreadMessageStore, 'prependMessages' | 'replaceMessages' | 'clear'>;
  /** Items per page; 0 disables history fetching. */
  pageSize: number;
  /** Only this agent's items; undefined for every agent's. */
  agent: string | undefined;
};

function toError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err));
}

/**
 * Internal hook used by `useThread` to own the thread's history paging, so every `useThreadMessages`
 * shares one state and one set of requests. Modeled on `useThreadMessageStore`.
 * @internal
 */
export function useThreadHistory({
  threadId,
  textTransport,
  messageStore,
  pageSize,
  agent,
}: UseThreadHistoryOptions): ThreadHistory {
  const { prependMessages, replaceMessages, clear } = messageStore;

  const [state, setStateRaw] = React.useState<ThreadHistoryState>(() =>
    pageSize > 0
      ? { status: 'idle', olderCursor: null, error: null }
      : { status: 'disabled', olderCursor: null, error: null },
  );
  // The operations read the current state synchronously (several can run in one tick), so mirror it.
  const stateRef = React.useRef(state);
  const setState = React.useCallback((next: ThreadHistoryState) => {
    stateRef.current = next;
    setStateRaw(next);
  }, []);

  // The latest inputs, read by the stable operations below. Assigned during render (not in an effect)
  // because a child's effect, such as useThreadMessages calling ensureLoaded, runs before this hook's.
  const latestRef = React.useRef({ threadId, textTransport, pageSize, agent });
  latestRef.current = { threadId, textTransport, pageSize, agent };

  // How many pages are loaded (what a `loaded` refresh re-fetches).
  const pagesLoadedRef = React.useRef(0);
  // The in-flight operation, so concurrent ensureLoaded calls share it.
  const inFlightRef = React.useRef<Promise<void> | null>(null);
  // Bumped whenever in-flight work is superseded (thread switch, refresh); stale results are dropped.
  const generationRef = React.useRef(0);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  // The thread id the transport created on the first send, if any.
  const startedByTransportRef = React.useRef<string | null>(null);

  /** Abort in-flight work and return the generation (and signal) for a new operation. */
  const beginOperation = React.useCallback(() => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    generationRef.current += 1;
    return { generation: generationRef.current, signal: controller.signal };
  }, []);

  const fetchPage = React.useCallback((cursor: string | undefined, signal: AbortSignal) => {
    const { textTransport, pageSize, agent } = latestRef.current;
    return textTransport.loadThreadMessagesPage({ pageSize, cursor, agent, signal });
  }, []);

  /** Track `promise` as the in-flight operation until it settles. */
  const track = React.useCallback((promise: Promise<void>) => {
    inFlightRef.current = promise;
    void promise.finally(() => {
      if (inFlightRef.current === promise) {
        inFlightRef.current = null;
      }
    });
    return promise;
  }, []);

  // React to thread switches and page-size changes.
  const previousThreadIdRef = React.useRef(threadId);
  React.useEffect(() => {
    const previousThreadId = previousThreadIdRef.current;
    previousThreadIdRef.current = threadId;

    if (previousThreadId !== threadId) {
      beginOperation();
      pagesLoadedRef.current = 0;
      const startedByTransport =
        previousThreadId === null &&
        threadId !== null &&
        startedByTransportRef.current === threadId;
      if (startedByTransport) {
        // The first send created this thread: the transcript already holds everything in it.
        pagesLoadedRef.current = 1;
        setState(
          pageSize > 0
            ? { status: 'ready', olderCursor: null, error: null }
            : { status: 'disabled', olderCursor: null, error: null },
        );
        return;
      }
      // A different thread: drop the previous thread's transcript.
      clear();
    }

    if (pageSize <= 0) {
      if (stateRef.current.status !== 'disabled') {
        beginOperation();
        setState({ status: 'disabled', olderCursor: null, error: null });
      }
      return;
    }
    if (previousThreadId !== threadId || stateRef.current.status === 'disabled') {
      setState({ status: 'idle', olderCursor: null, error: null });
    }
  }, [threadId, pageSize, beginOperation, clear, setState]);

  // Abort anything in flight on unmount.
  React.useEffect(() => () => abortControllerRef.current?.abort(), []);

  const ensureLoaded = React.useCallback((): Promise<void> => {
    if (inFlightRef.current) {
      return inFlightRef.current;
    }
    if (stateRef.current.status !== 'idle' || latestRef.current.threadId === null) {
      return Promise.resolve();
    }

    const { generation, signal } = beginOperation();
    setState({ status: 'loading', olderCursor: null, error: null });
    return track(
      (async () => {
        try {
          const page = await fetchPage(undefined, signal);
          if (generation !== generationRef.current) {
            return;
          }
          // Prepend, so history lands ahead of anything that arrived live in the meantime.
          prependMessages(page.messages);
          pagesLoadedRef.current = 1;
          setState({ status: 'ready', olderCursor: page.olderCursor, error: null });
        } catch (err) {
          if (generation !== generationRef.current) {
            return;
          }
          setState({ status: 'error', olderCursor: null, error: toError(err) });
        }
      })(),
    );
  }, [beginOperation, fetchPage, prependMessages, setState, track]);

  const loadOlder = React.useCallback((): Promise<void> => {
    const current = stateRef.current;
    if (current.status !== 'ready' && current.status !== 'error') {
      return inFlightRef.current ?? Promise.resolve();
    }
    const cursor = current.olderCursor;
    if (cursor === null) {
      return Promise.resolve();
    }

    const { generation, signal } = beginOperation();
    setState({ status: 'loading-older', olderCursor: cursor, error: null });
    return track(
      (async () => {
        try {
          const page = await fetchPage(cursor, signal);
          if (generation !== generationRef.current) {
            return;
          }
          prependMessages(page.messages);
          pagesLoadedRef.current += 1;
          setState({ status: 'ready', olderCursor: page.olderCursor, error: null });
        } catch (err) {
          if (generation !== generationRef.current) {
            return;
          }
          // Keep the cursor, so calling loadOlder again retries the same page.
          setState({ status: 'error', olderCursor: cursor, error: toError(err) });
        }
      })(),
    );
  }, [beginOperation, fetchPage, prependMessages, setState, track]);

  const refresh = React.useCallback(
    (options: ThreadHistoryRefreshOptions = {}): Promise<void> => {
      const current = stateRef.current;
      if (current.status === 'disabled' || latestRef.current.threadId === null) {
        return Promise.resolve();
      }
      const pageCount =
        (options.mode ?? 'loaded') === 'latest' ? 1 : Math.max(pagesLoadedRef.current, 1);
      // Keep the cursor of what is on screen while the refresh runs.
      const previousCursor = current.olderCursor;

      // A refresh supersedes anything in flight.
      const { generation, signal } = beginOperation();
      setState({ status: 'refreshing', olderCursor: previousCursor, error: null });
      return track(
        (async () => {
          try {
            // Pages arrive newest first, each oldest-first within itself.
            const pages: Array<Array<ReceivedMessage>> = [];
            let cursor: string | undefined;
            let olderCursor: string | null = null;
            for (let i = 0; i < pageCount; i += 1) {
              const page = await fetchPage(cursor, signal);
              if (generation !== generationRef.current) {
                return;
              }
              pages.push(page.messages);
              olderCursor = page.olderCursor;
              if (olderCursor === null) {
                break;
              }
              cursor = olderCursor;
            }
            replaceMessages(pages.reverse().flat());
            pagesLoadedRef.current = pages.length;
            setState({ status: 'ready', olderCursor, error: null });
          } catch (err) {
            if (generation !== generationRef.current) {
              return;
            }
            // The transcript is untouched (it is only replaced on success).
            setState({ status: 'error', olderCursor: previousCursor, error: toError(err) });
          }
        })(),
      );
    },
    [beginOperation, fetchPage, replaceMessages, setState, track],
  );

  const onThreadStarted = React.useCallback((startedThreadId: string) => {
    startedByTransportRef.current = startedThreadId;
  }, []);

  return React.useMemo(
    () => ({ ...state, ensureLoaded, loadOlder, refresh, onThreadStarted }),
    [state, ensureLoaded, loadOlder, refresh, onThreadStarted],
  );
}
