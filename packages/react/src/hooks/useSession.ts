import * as React from 'react';
import {
  Room,
  ConnectionState,
  TokenSourceConfigurable,
  TokenSourceFixed,
  TokenSourceFetchOptions,
  BaseKeyProvider,
  type BaseE2EEManager,
} from 'livekit-client';

import { useThread, isUseThreadReturn, type UseThreadReturn } from './useThread';
import { useEnsureThread } from '../context/thread-context';
import {
  useSessionCall,
  type SessionCallOptions,
  type SessionCallStateCommon,
  type SessionCallStateConnecting,
  type SessionCallStateConnected,
  type SessionCallStateDisconnected,
  type SessionCallActions,
} from './useSessionCall';
import { type TextTransportBaseUrl } from '../text-transport/TextTransport';

// The call layer (room, connection, tracks, start/end) now lives in `useSessionCall`; its event and
// option types are part of the session's public surface, so re-export them from here.
export { SessionEvent } from './useSessionCall';
export type {
  SessionCallbacks,
  SessionConnectOptions,
  SessionCallOptions,
  SessionCallEncryptionOptions,
} from './useSessionCall';

/** @beta */
export type SwitchActiveDeviceOptions = {
  /**
   *  If true, adds an `exact` constraint to the getUserMedia request.
   *  The request will fail if this option is true and the device specified is not actually available
   */
  exact?: boolean;
};

// The session-only additions to the call layer's `internal`. The call fields (room, connectionState,
// isConnected, local, emitter, agent-timeout controls) are defined once in `useSessionCall`; a session
// is that call plus a durable thread, so it only adds the thread back-reference and token source here.
type SessionInternalExtra = {
  tokenSource: TokenSourceConfigurable | TokenSourceFixed;

  /**
   * Back-reference to the durable thread this session composes (created internally in the legacy
   * form, or the thread the session is attached to). Used by `SessionProvider` and
   * `useSessionMessages` to resolve the thread. Not part of the stable public surface.
   * @internal
   */
  thread: UseThreadReturn;
};

// A call state type with the session-only `internal` fields folded in, so the call types in
// `useSessionCall` remain the single source of truth for the shared call fields.
type WithSessionInternal<T extends SessionCallStateCommon> = Omit<T, 'internal'> & {
  internal: T['internal'] & SessionInternalExtra;
};

type SessionStateCommon = WithSessionInternal<SessionCallStateCommon>;
type SessionStateConnecting = WithSessionInternal<SessionCallStateConnecting>;
type SessionStateConnected = WithSessionInternal<SessionCallStateConnected>;
type SessionStateDisconnected = WithSessionInternal<SessionCallStateDisconnected>;

/** @beta */
export type UseSessionReturn = (
  SessionStateConnecting | SessionStateConnected | SessionStateDisconnected
) &
  SessionCallActions;

/** @internal */
export function isUseSessionReturn(value: unknown): value is UseSessionReturn {
  return (
    typeof value === 'object' &&
    value !== null &&
    'room' in value &&
    'connectionState' in value &&
    'internal' in value
  );
}

/** @beta */
export type UseSessionEncryptionOptions =
  | {
      /**
       * Accepts a passphrase that's used to create the crypto keys.
       * When passing in a string, PBKDF2 is used. (recommended for maximum compatibility across SDKs)
       * When passing in an ArrayBuffer of cryptographically random numbers, HKDF is used.
       *
       * Note: Not all client SDKs support HKDF.
       */
      key: string | ArrayBuffer | BaseKeyProvider;

      /** An instance of the E2EE webworker, which must be constructed using your js build tool's
       * webworker construction mechanism. */
      worker: Worker;

      e2eeManager?: undefined;
    }
  | {
      key?: undefined;
      worker?: undefined;
      /**
       * For React Native usage: Pass the e2eeManager obtained from the `useRNE2EEManager()` hook
       * in the `\@livekit/react-native` package.
       */
      e2eeManager: BaseE2EEManager;
    }
  | {
      key?: undefined;
      worker?: undefined;
      e2eeManager?: undefined;
    };

type UseSessionCommonOptions = {
  /**
   * Amount of time in milliseonds the system will wait for an agent to join the room, before
   * transitioning to the "failure" state.
   */
  agentConnectTimeoutMilliseconds?: number;

  /**
   * The A2A interface base URL (or a callback building it from the project id) for the session's
   * text transport. Text messages sent via useSessionMessages go here, not the data channel.
   */
  textBaseUrl?: TextTransportBaseUrl;

  /**
   * An existing conversation/thread id to resume. Seeds the text transport's thread id; omit to let
   * the agent create a new thread on the first message.
   */
  threadId?: string;
};

type UseSessionWithRoomOptions = {
  room: Room;
  encryption?: never;
};

type UseSessionWithoutRoomOptions = {
  // NOTE: This must be here to make typescript go down this discriminated union branch when
  // "room" is omitted.
  room?: never;

  /** Configuration for room-level E2EE */
  encryption?: UseSessionEncryptionOptions;
};

type UseSessionRoomOptions = UseSessionWithRoomOptions | UseSessionWithoutRoomOptions;

/** @beta */
export type UseSessionConfigurableOptions = UseSessionCommonOptions &
  UseSessionRoomOptions &
  TokenSourceFetchOptions;
/** @beta */
export type UseSessionFixedOptions = UseSessionCommonOptions & UseSessionRoomOptions;

/**
 * A Session is a live, managed connection to a Room that can contain Agents, bound to a durable thread.
 *
 * It owns the room, the connection state, local tracks, and the start/end lifecycle (the call layer),
 * over a {@link useThread} (the durable conversation: text transport, message store, thread id and
 * history). The thread is exposed on `internal.thread` so `useSessionMessages` and `SessionProvider`
 * can resolve it.
 *
 * It has two forms:
 *  - **attached** (preferred): pass a `thread` (or render inside a Thread provider and omit it) plus
 *    call options. The session drives the call over that externally-owned thread, so you can also use
 *    `useThread`, `useThreadMessages` and `useAgent` against the same thread.
 *  - **legacy** (`@deprecated`): pass a `tokenSource` plus options; the session creates and owns its
 *    own thread internally. Migrate by lifting a `useThread(tokenSource, …)` above and passing it in.
 *
 * NOTE: a given component must use ONE form consistently — do not switch a call site between the token
 * source form and the thread/options form across renders (it selects a different internal hook; the
 * hook throws a clear error if it detects a switch).
 * @beta
 */
export function useSession(
  thread: UseThreadReturn,
  options?: SessionCallOptions,
): UseSessionReturn;
/**
 * @deprecated Pass a `useThread(tokenSource, …)` to `useSession` instead of a token source. The legacy
 * form creates and owns its thread internally; the attached form lets the thread be shared with
 * `useThread` / `useThreadMessages` / `useAgent`.
 * @beta
 */
export function useSession(
  tokenSource: TokenSourceConfigurable,
  options?: UseSessionConfigurableOptions,
): UseSessionReturn;
/**
 * @deprecated Pass a `useThread(tokenSource, …)` to `useSession` instead of a token source.
 * @beta
 */
export function useSession(
  tokenSource: TokenSourceFixed,
  options?: UseSessionFixedOptions,
): UseSessionReturn;
/**
 * A Session attached to the thread from a Thread provider in context.
 * @beta
 */
export function useSession(options?: SessionCallOptions): UseSessionReturn;
export function useSession(
  arg1?: TokenSourceConfigurable | TokenSourceFixed | UseThreadReturn | SessionCallOptions,
  arg2?: UseSessionConfigurableOptions | UseSessionFixedOptions | SessionCallOptions,
): UseSessionReturn {
  // The legacy form is detected by a token source as the first argument; everything else is the
  // attached form (an explicit thread, context thread, or just call options).
  const isLegacy =
    arg1 instanceof TokenSourceConfigurable || arg1 instanceof TokenSourceFixed;

  // The form drives a conditional hook call below, so it must be stable for a component's lifetime.
  // Capture it on the first render and throw a clear error if a later render switches forms (otherwise
  // React would surface a cryptic "rendered more/fewer hooks" error).
  const initialIsLegacyRef = React.useRef(isLegacy);
  if (initialIsLegacyRef.current !== isLegacy) {
    throw new Error(
      'useSession: the argument form must not change between renders. A component must consistently ' +
        'call useSession with either a token source (legacy) or a thread / options (attached) — not ' +
        'switch between them.',
    );
  }

  // Whether end() should also tear down the thread's text transport: only in the legacy form, where
  // the session owns the thread. In the attached form the thread is owned by the caller, so end() only
  // disconnects the call.
  const sessionOwnsThread = isLegacy;

  let thread: UseThreadReturn;
  let callOptions: SessionCallOptions;
  if (isLegacy) {
    const tokenSource = arg1 as TokenSourceConfigurable | TokenSourceFixed;
    const {
      agentConnectTimeoutMilliseconds,
      room,
      encryption,
      textBaseUrl,
      threadId,
      ...tokenFetchOptions
    } = (arg2 ?? {}) as UseSessionConfigurableOptions | UseSessionFixedOptions;

    callOptions = { agentConnectTimeoutMilliseconds, room, encryption } as SessionCallOptions;

    // The cast lets the one impl path call the overloaded `useThread` with a union tokenSource;
    // `useThread` branches on `instanceof TokenSourceConfigurable` at runtime, so a fixed source is
    // handled correctly regardless.
    // Stable branch: see the `initialIsLegacyRef` guard above.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    thread = useThread(tokenSource as TokenSourceConfigurable, {
      textBaseUrl,
      threadId,
      ...tokenFetchOptions,
    });
  } else {
    const explicitThread = isUseThreadReturn(arg1) ? (arg1 as UseThreadReturn) : undefined;
    callOptions = ((isUseThreadReturn(arg1) ? arg2 : arg1) as SessionCallOptions | undefined) ?? {};

    // Stable branch: see the `initialIsLegacyRef` guard above.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    thread = useEnsureThread(explicitThread);
  }

  // The live media/room half, attached to the thread.
  const call = useSessionCall(thread, callOptions);

  const sessionInternal = React.useMemo(
    (): SessionStateCommon['internal'] => ({
      emitter: call.internal.emitter,
      tokenSource: thread.internal.tokenSource,
      agentConnectTimeoutMilliseconds: call.internal.agentConnectTimeoutMilliseconds,

      agentTimeoutFailureReason: call.internal.agentTimeoutFailureReason,
      startAgentTimeout: call.internal.startAgentTimeout,
      clearAgentTimeout: call.internal.clearAgentTimeout,
      clearAgentTimeoutFailureReason: call.internal.clearAgentTimeoutFailureReason,
      updateAgentTimeoutState: call.internal.updateAgentTimeoutState,
      updateAgentTimeoutParticipantExists: call.internal.updateAgentTimeoutParticipantExists,

      thread,
    }),
    [call.internal, thread],
  );

  const sessionState = React.useMemo((): SessionStateConnecting
    | SessionStateConnected
    | SessionStateDisconnected => {
    const common: SessionStateCommon = { room: call.room, internal: sessionInternal };

    switch (call.connectionState) {
      case ConnectionState.Connecting:
        return {
          ...common,
          connectionState: ConnectionState.Connecting,
          isConnected: false,
          local: {
            cameraTrack: undefined,
            microphoneTrack: undefined,
            screenShareTrack: undefined,
          },
        };

      case ConnectionState.Connected:
      case ConnectionState.Reconnecting:
      case ConnectionState.SignalReconnecting:
        return {
          ...common,
          connectionState: call.connectionState,
          isConnected: true,
          local: call.local,
        };

      case ConnectionState.Disconnected:
        return {
          ...common,
          connectionState: ConnectionState.Disconnected,
          isConnected: false,
          local: {
            cameraTrack: undefined,
            microphoneTrack: undefined,
            screenShareTrack: undefined,
          },
        };
    }
  }, [call, sessionInternal]);

  // The public end: stop the call. In the legacy form (the session owns its thread) also tear down the
  // thread's text transport, matching the former media-stop + text-transport-disconnect behavior. In
  // the attached form the thread is owned by the caller, so end() must not touch it.
  const end = React.useCallback(async () => {
    await call.end();
    if (sessionOwnsThread) {
      await thread.textTransport.disconnect();
    }
  }, [call.end, thread.textTransport, sessionOwnsThread]);

  return React.useMemo(
    () => ({
      ...sessionState,

      waitUntilConnected: call.waitUntilConnected,
      waitUntilDisconnected: call.waitUntilDisconnected,

      prepareConnection: call.prepareConnection,
      start: call.start,
      end,

      setEncryptionEnabled: call.setEncryptionEnabled,
    }),
    [
      sessionState,
      call.waitUntilConnected,
      call.waitUntilDisconnected,
      call.prepareConnection,
      call.start,
      end,
      call.setEncryptionEnabled,
    ],
  );
}
