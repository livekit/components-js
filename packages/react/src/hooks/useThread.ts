import * as React from 'react';
import type TypedEventEmitter from 'typed-emitter';
import {
  ConnectionState,
  Room,
  TokenSourceConfigurable,
  TokenSourceFixed,
  TokenSourceFetchOptions,
  type TokenSourceResponseObject,
} from 'livekit-client';
import { EventEmitter } from 'events';

import { log } from '@livekit/components-core';
import { TextTransport, type TextTransportBaseUrl } from '../text-transport/TextTransport';
import { useThreadMessageStore, type ThreadMessageStore } from './useThreadMessageStore';
import { useEvents } from './useEvents';
import type { AgentState } from './useAgent';

/** @beta */
export enum ThreadEvent {
  /** Emits once the transport establishes a thread id (A2A `contextId`). args: (threadId: string) */
  ThreadStarted = 'threadStarted',
}

/** @beta */
export type ThreadCallbacks = {
  [ThreadEvent.ThreadStarted]: (threadId: string) => void;
};

/** A credential fetch: `tokenSource.fetch(...)` bound to the thread's fetch options. */
export type ThreadTokenSourceFetch = (force?: boolean) => Promise<TokenSourceResponseObject>;

/**
 * The minimal surface `useAgent` needs to derive agent state from an attached call: the call's
 * connection state and the agent-connect-timeout controls. The call's `Room` is NOT part of this —
 * the thread owns the single canonical `Room` (`internal.room`), which an attached call registers via
 * `registerCall`. A `useSessionCall` return and the composite `useSession` return both drive this; a
 * `useThread` exposes its active call (if any) on `internal.activeCall`, so `useAgent(thread)` can
 * resolve one.
 * @beta
 */
export type ActiveCall = {
  connectionState: ConnectionState;
  internal: {
    agentConnectTimeoutMilliseconds?: number;

    agentTimeoutFailureReason: string | null;
    startAgentTimeout: (agentConnectTimeoutMilliseconds?: number) => void;
    clearAgentTimeout: () => void;
    clearAgentTimeoutFailureReason: () => void;
    updateAgentTimeoutState: (agentState: AgentState) => void;
    updateAgentTimeoutParticipantExists: (agentParticipantExists: boolean) => void;
  };
};

/**
 * The agent's text-mode response lifecycle, shared across the thread's consumers:
 *   - `idle`: at rest (nothing in flight).
 *   - `thinking`: a sent message has reached the server and we are awaiting the response.
 *   - `typing`: the response is streaming back (the text-mode equivalent of voice `speaking`).
 * Driven by `useThreadMessages().send()`; read by `useAgent` when no call is connected.
 * @beta
 */
export type ThreadTextAgentState = 'idle' | 'thinking' | 'typing';

/**
 * The thread's readiness lifecycle. A thread has no persistent socket (text is request/response per
 * turn), so this reflects credential/history readiness rather than a connection:
 *   - `idle`: initial, before the first readiness pass.
 *   - `loadingHistory`: an existing thread's history is being fetched.
 *   - `ready`: ready to send and receive (history, if any, has loaded).
 * @beta
 */
export type ThreadStatus = 'idle' | 'loadingHistory' | 'ready';

type ThreadStateCommon = {
  /** The active conversation/thread id (A2A `contextId`), or undefined before one is established. */
  threadId: string | undefined;

  /** The text transport this thread sends and receives chat over. */
  textTransport: TextTransport;

  internal: {
    /** Fires `ThreadEvent.ThreadStarted` when the transport first establishes a thread id. */
    emitter: TypedEventEmitter<ThreadCallbacks>;
    tokenSource: TokenSourceConfigurable | TokenSourceFixed;
    /** The shared credential fetch, reused by an attached call for its room token. */
    tokenSourceFetch: ThreadTokenSourceFetch;
    /** The shared, mode-independent message store. */
    messageStore: ThreadMessageStore;
    /**
     * The single canonical `Room` for this thread. When a call is attached it is that call's room
     * (registered via `registerCall`); otherwise it is a disconnected placeholder, so `useAgent` can
     * run its room-derived hooks even for a call-less, text-only thread.
     */
    room: Room;
    /** The call currently attached to this thread (registered by `useSessionCall`), or null. */
    activeCall: ActiveCall | null;
    /**
     * Register (or clear, with null) the call attached to this thread, together with its room (which
     * becomes `internal.room` while attached). Used by `useSessionCall`.
     */
    registerCall: (call: ActiveCall | null, room?: Room | null) => void;
    /** The shared text-mode response lifecycle, driven by `useThreadMessages().send()`. */
    textAgentState: ThreadTextAgentState;
    /** Set the shared text-mode response lifecycle. Used by `useThreadMessages().send()`. */
    setTextAgentState: (state: ThreadTextAgentState) => void;
  };
};

/** @beta */
export type UseThreadReturn =
  | ({ status: 'idle' } & ThreadStateCommon)
  | ({ status: 'loadingHistory' } & ThreadStateCommon)
  | ({ status: 'ready' } & ThreadStateCommon);

/** @internal */
export function isUseThreadReturn(value: unknown): value is UseThreadReturn {
  return (
    typeof value === 'object' &&
    value !== null &&
    'status' in value &&
    'textTransport' in value &&
    'internal' in value &&
    !('room' in value)
  );
}

type UseThreadCommonOptions = {
  /**
   * The A2A interface base URL (or a callback building it from the project id) for the thread's text
   * transport. Text messages sent via useThreadMessages go here, not the data channel.
   */
  textBaseUrl?: TextTransportBaseUrl;

  /**
   * An existing conversation/thread id to resume. Seeds the text transport's thread id and loads that
   * thread's history; omit to let the agent create a new thread on the first message.
   */
  threadId?: string;
};

/** @beta */
export type UseThreadConfigurableOptions = UseThreadCommonOptions & TokenSourceFetchOptions;
/** @beta */
export type UseThreadFixedOptions = UseThreadCommonOptions;

/**
 * Given two TokenSourceFetchOptions values, check to see if they are deep equal.
 *
 * FIXME: swap this for an import from livekit-client once
 * https://github.com/livekit/client-sdk-js/pull/1733 is merged and published!
 * */
function areTokenSourceFetchOptionsEqual(a: TokenSourceFetchOptions, b: TokenSourceFetchOptions) {
  const allKeysSet = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<
    keyof TokenSourceFetchOptions
  >;

  for (const key of allKeysSet) {
    switch (key) {
      case 'roomName':
      case 'participantName':
      case 'participantIdentity':
      case 'participantMetadata':
      case 'participantAttributes':
      case 'agentName':
      case 'agentMetadata':
      case 'deployment':
        if (a[key] !== b[key]) {
          return false;
        }
        break;
      default:
        // ref: https://stackoverflow.com/a/58009992
        const exhaustiveCheckedKey: never = key;
        throw new Error(`Options key ${exhaustiveCheckedKey} not being checked for equality!`);
    }
  }

  return true;
}

/** Internal hook that builds a function which properly invokes `tokenSource.fetch(...)` with any
 * fetch options, memoizing the options so the returned callback stays stable across renders. */
function useThreadTokenSourceFetch(
  tokenSource: TokenSourceConfigurable | TokenSourceFixed,
  unstableRestOptions: TokenSourceFetchOptions,
): ThreadTokenSourceFetch {
  const isConfigurable = tokenSource instanceof TokenSourceConfigurable;

  const memoizedTokenFetchOptionsRef = React.useRef<TokenSourceFetchOptions | null>(
    isConfigurable ? unstableRestOptions : null,
  );

  React.useEffect(() => {
    if (!isConfigurable) {
      memoizedTokenFetchOptionsRef.current = null;
      return;
    }

    if (
      memoizedTokenFetchOptionsRef.current !== null &&
      areTokenSourceFetchOptionsEqual(memoizedTokenFetchOptionsRef.current, unstableRestOptions)
    ) {
      return;
    }
    memoizedTokenFetchOptionsRef.current = unstableRestOptions;
  }, [isConfigurable, unstableRestOptions]);

  return React.useCallback(
    async (force?: boolean) => {
      if (isConfigurable) {
        if (!memoizedTokenFetchOptionsRef.current) {
          throw new Error(
            `useThread - memoized token fetch options are not set, but the passed tokenSource was an instance of TokenSourceConfigurable. If you are seeing this please make a new GitHub issue!`,
          );
        }
        return tokenSource.fetch(memoizedTokenFetchOptionsRef.current, force);
      } else {
        return tokenSource.fetch();
      }
    },
    [isConfigurable, tokenSource],
  );
}

/**
 * Encode the thread id into an agent-dispatch metadata string. The agents-2.0 worker reads the thread
 * from `thread_id` of the JSON-decoded dispatch metadata (livekit-agents worker.py), so we merge
 * `thread_id` into any existing metadata JSON. An attached call's room token is fetched through this
 * same credential, so the dispatched agent joins this thread.
 */
function withThreadIdMetadata(agentMetadata: string | undefined, threadId: string): string {
  let base: Record<string, unknown> = {};
  if (agentMetadata) {
    try {
      const parsed = JSON.parse(agentMetadata);
      if (parsed && typeof parsed === 'object') {
        base = parsed as Record<string, unknown>;
      }
    } catch {
      // Non-JSON metadata can't carry a thread_id key; it is replaced.
    }
  }
  return JSON.stringify({ ...base, thread_id: threadId });
}

/**
 * A Thread is a durable conversation with an agent (one A2A `contextId` / `AT_…` thread). It owns the
 * text transport, the shared message store, the thread id, and the thread's history; a voice `useSession`
 * attaches to it for a live room. `useSession` composes a thread and a call together.
 * @beta
 */
export function useThread(
  tokenSource: TokenSourceConfigurable,
  options?: UseThreadConfigurableOptions,
): UseThreadReturn;
/**
 * A Thread is a durable conversation with an agent (one A2A `contextId` / `AT_…` thread). It owns the
 * text transport, the shared message store, the thread id, and the thread's history; a voice `useSession`
 * attaches to it for a live room. `useSession` composes a thread and a call together.
 * @beta
 */
export function useThread(
  tokenSource: TokenSourceFixed,
  options?: UseThreadFixedOptions,
): UseThreadReturn;
export function useThread(
  tokenSource: TokenSourceConfigurable | TokenSourceFixed,
  options: UseThreadConfigurableOptions | UseThreadFixedOptions = {},
): UseThreadReturn {
  const { textBaseUrl, threadId: userProvidedThreadId } = options;

  const [threadId, setThreadId] = React.useState(userProvidedThreadId);
  React.useEffect(() => setThreadId(userProvidedThreadId), [userProvidedThreadId]);

  // The shared, mode-independent message store.
  const messageStore = useThreadMessageStore();

  const emitter = React.useMemo(
    () => new EventEmitter() as TypedEventEmitter<ThreadCallbacks>,
    [],
  );

  // The single canonical room for this thread. Until a call attaches, it is a disconnected
  // placeholder so `useAgent` (which runs unconditional room-derived hooks) works for a text-only
  // thread; a never-connected room yields no remote participants and no tracks, exactly as text mode
  // wants. When a call attaches, `registerCall` swaps in the call's room.
  const placeholderRoom = React.useMemo(() => new Room(), []);
  React.useEffect(() => {
    return () => {
      placeholderRoom.disconnect();
    };
  }, [placeholderRoom]);

  // The call attached to this thread, registered by `useSessionCall`, so `useAgent(thread)` can resolve it.
  // A thread with no active call drives no voice agent state (that is a call/room concern).
  const [activeCall, setActiveCall] = React.useState<ActiveCall | null>(null);
  const [callRoom, setCallRoom] = React.useState<Room | null>(null);
  const registerCall = React.useCallback((call: ActiveCall | null, room?: Room | null) => {
    setActiveCall(call);
    setCallRoom(room ?? null);
  }, []);
  const room = callRoom ?? placeholderRoom;

  // The shared text-mode response lifecycle (idle → thinking → typing → idle), driven by
  // `useThreadMessages().send()` and read by `useAgent` when no call is connected.
  const [textAgentState, setTextAgentState] = React.useState<ThreadTextAgentState>('idle');

  const {
    // `textBaseUrl`/`threadId` are thread concerns; strip them so they never reach the token fetch
    // options (areTokenSourceFetchOptionsEqual throws on unknown keys).
    textBaseUrl: _textBaseUrl,
    threadId: _threadId,
    ...unstableRestOptions
  } = options;

  // Carry the thread id in the agent dispatch metadata so an attached call's agent is dispatched
  // against this thread (the room token is fetched through the same credential).
  const tokenFetchOptions =
    typeof threadId === 'undefined'
      ? unstableRestOptions
      : {
          ...unstableRestOptions,
          agentMetadata: withThreadIdMetadata(
            (unstableRestOptions as TokenSourceFetchOptions).agentMetadata,
            threadId,
          ),
        };
  const tokenSourceFetch = useThreadTokenSourceFetch(tokenSource, tokenFetchOptions);

  const textTransport = React.useMemo(
    () => new TextTransport({ baseUrl: textBaseUrl, getCredentials: tokenSourceFetch, threadId }),
    [textBaseUrl, tokenSourceFetch, threadId],
  );

  useEvents(
    textTransport,
    'threadStarted',
    (newThreadId: string) => {
      setThreadId(newThreadId);
      emitter.emit(ThreadEvent.ThreadStarted, newThreadId);
    },
    [],
  );

  const [status, setStatus] = React.useState<ThreadStatus>('idle');

  // Seed the transcript from the active thread's existing messages. When a threadId is provided we
  // fetch its full history (paginated to the start) and upsert it into the shared store; a thread with
  // no threadId starts empty. Switching threadId drops the previous thread's transcript first.
  const lastFetchedThreadIdRef = React.useRef(threadId);
  const messagesEmpty = messageStore.messages.length === 0;
  React.useEffect(() => {
    const threadAddedToExistingSession =
      !messagesEmpty &&
      typeof lastFetchedThreadIdRef.current === 'undefined' &&
      typeof threadId !== 'undefined';
    if (threadAddedToExistingSession) {
      setStatus('ready');
      return;
    }

    const controller = new AbortController();

    const threadChanged =
      typeof threadId !== 'undefined' && lastFetchedThreadIdRef.current !== threadId;
    if (threadChanged) {
      messageStore.clear();
      lastFetchedThreadIdRef.current = threadId;
      setStatus('loadingHistory');

      void (async () => {
        try {
          const history = await textTransport.loadThreadMessages({ signal: controller.signal });
          if (!controller.signal.aborted) {
            messageStore.upsertMessages(history);
          }
        } catch (err) {
          if (!controller.signal.aborted) {
            log.warn('useThread: failed to load thread history', err);
          }
        } finally {
          if (!controller.signal.aborted) {
            setStatus('ready');
          }
        }
      })();
      return () => {
        controller.abort();
      };
    }

    const threadIdDropped = typeof threadId === 'undefined';
    if (threadIdDropped) {
      messageStore.clear();
      lastFetchedThreadIdRef.current = undefined;
    }
    setStatus('ready');
    return;
  }, [threadId, textTransport, messageStore.upsertMessages, messageStore.clear]);

  const internal = React.useMemo(
    () => ({
      emitter,
      tokenSource,
      tokenSourceFetch,
      messageStore,
      room,
      activeCall,
      registerCall,
      textAgentState,
      setTextAgentState,
    }),
    [
      emitter,
      tokenSource,
      tokenSourceFetch,
      messageStore,
      room,
      activeCall,
      registerCall,
      textAgentState,
      setTextAgentState,
    ],
  );

  return React.useMemo((): UseThreadReturn => {
    const common: ThreadStateCommon = {
      threadId,
      textTransport,
      internal,
    };

    switch (status) {
      case 'idle':
        return { ...common, status: 'idle' };
      case 'loadingHistory':
        return { ...common, status: 'loadingHistory' };
      case 'ready':
        return { ...common, status: 'ready' };
    }
  }, [status, threadId, textTransport, internal]);
}
