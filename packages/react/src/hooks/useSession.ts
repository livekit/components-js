import * as React from 'react';
import type TypedEventEmitter from 'typed-emitter';
import {
  Room,
  ConnectionState,
  TrackPublishOptions,
  TokenSourceConfigurable,
  TokenSourceFixed,
  TokenSourceFetchOptions,
  RoomConnectOptions,
  BaseKeyProvider,
  type BaseE2EEManager,
} from 'livekit-client';

import { TrackReference } from '@livekit/components-core';
import { AgentState } from './useAgent';
import { useThread, type UseThreadReturn } from './useThread';
import { useCall, type UseCallOptions } from './useCall';
import { type TextTransportBaseUrl } from '../text-transport/TextTransport';

/** @beta */
export enum SessionEvent {
  ConnectionStateChanged = 'connectionStateChanged',
  /**
   * Emits when an error is encountered while attempting to create a track.
   * Use MediaDeviceFailure.getFailure(error) to get the reason of failure.
   * args: (error: Error, kind: MediaDeviceKind)
   */
  MediaDevicesError = 'mediaDevicesError',
  /**
   * Emits when an error is received while decrypting frame received frame information.
   * args: (error: Error)
   */
  EncryptionError = 'encryptionError',
}

/** @beta */
export type SessionCallbacks = {
  [SessionEvent.ConnectionStateChanged]: (newAgentConnectionState: ConnectionState) => void;
  [SessionEvent.MediaDevicesError]: (error: Error) => void;
  [SessionEvent.EncryptionError]: (error: Error) => void;
};

/** @beta */
export type SessionConnectOptions = {
  /** Optional abort signal which if triggered will terminate connecting even if it isn't complete */
  signal?: AbortSignal;

  tracks?: {
    microphone?: {
      enabled?: boolean;
      publishOptions?: TrackPublishOptions;
    };
    camera?: {
      enabled?: boolean;
      publishOptions?: TrackPublishOptions;
    };
    screenShare?: {
      enabled?: boolean;
      publishOptions?: TrackPublishOptions;
    };
  };

  /** Options for Room.connect(.., .., opts) */
  roomConnectOptions?: RoomConnectOptions;
};

/** @beta */
export type SwitchActiveDeviceOptions = {
  /**
   *  If true, adds an `exact` constraint to the getUserMedia request.
   *  The request will fail if this option is true and the device specified is not actually available
   */
  exact?: boolean;
};

type SessionStateCommon = {
  room: Room;
  internal: {
    emitter: TypedEventEmitter<SessionCallbacks>;
    tokenSource: TokenSourceConfigurable | TokenSourceFixed;
    agentConnectTimeoutMilliseconds?: number;

    agentTimeoutFailureReason: string | null;
    startAgentTimeout: (agentConnectTimeoutMilliseconds?: number) => void;
    clearAgentTimeout: () => void;
    clearAgentTimeoutFailureReason: () => void;
    updateAgentTimeoutState: (agentState: AgentState) => void;
    updateAgentTimeoutParticipantExists: (agentParticipantExists: boolean) => void;

    /**
     * Back-reference to the durable thread this session composes. Used by `SessionProvider` and
     * `useSessionMessages` to resolve the thread. Not part of the stable public surface.
     * @internal
     */
    thread: UseThreadReturn;
  };
};

type SessionStateConnecting = SessionStateCommon & {
  connectionState: ConnectionState.Connecting;
  isConnected: false;

  local: {
    cameraTrack: undefined;
    microphoneTrack: undefined;
    screenShareTrack: undefined;
  };
};

type SessionStateConnected = SessionStateCommon & {
  connectionState:
    ConnectionState.Connected | ConnectionState.Reconnecting | ConnectionState.SignalReconnecting;
  isConnected: true;

  local: {
    cameraTrack?: TrackReference;
    microphoneTrack?: TrackReference;
    screenShareTrack?: TrackReference;
  };
};

type SessionStateDisconnected = SessionStateCommon & {
  connectionState: ConnectionState.Disconnected;
  isConnected: false;

  local: {
    cameraTrack: undefined;
    microphoneTrack: undefined;
    screenShareTrack: undefined;
  };
};

type SessionActions = {
  /** Returns a promise that resolves once the room connects. */
  waitUntilConnected: (signal?: AbortSignal) => Promise<void>;
  /** Returns a promise that resolves once the room disconnects */
  waitUntilDisconnected: (signal?: AbortSignal) => Promise<void>;

  prepareConnection: () => Promise<void>;

  /** Connect to the underlying room and dispatch any agents */
  start: (options?: SessionConnectOptions) => Promise<void>;

  /** Disconnect from the underlying room */
  end: () => Promise<void>;

  /** Enable or disable E2EE. */
  setEncryptionEnabled: (enabled: boolean) => Promise<void>;
};

/** @beta */
export type UseSessionReturn = (
  SessionStateConnecting | SessionStateConnected | SessionStateDisconnected
) &
  SessionActions;

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

type UseSessionEncryptionOptions =
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

type UseSessionWithoutRoomOptions = {
  // NOTE: This must be here to make typescript go down this discriminated union branch when
  // "room" is omitted.
  room?: never;

  /** Configuration for room-level E2EE */
  encryption?: UseSessionEncryptionOptions;
};

type UseSessionRoomOptions = UseSessionWithRoomOptions | UseSessionWithoutRoomOptions;

type UseSessionConfigurableOptions = UseSessionCommonOptions &
  UseSessionRoomOptions &
  TokenSourceFetchOptions;
type UseSessionFixedOptions = UseSessionCommonOptions & UseSessionRoomOptions;

/**
 * A Session represents a managed connection to a Room which can contain Agents.
 *
 * It is a thin composite over {@link useThread} (the durable conversation: text transport, message
 * store, thread id and history) and {@link useCall} (the live room: connection state, tracks, and the
 * start/end lifecycle). The thread is exposed on `internal.thread` so `useSessionMessages` and
 * `SessionProvider` can resolve it.
 * @beta
 */
export function useSession(
  tokenSource: TokenSourceConfigurable,
  options?: UseSessionConfigurableOptions,
): UseSessionReturn;
/**
 * A Session represents a managed connection to a Room which can contain Agents.
 * @beta
 */
export function useSession(
  tokenSource: TokenSourceFixed,
  options?: UseSessionFixedOptions,
): UseSessionReturn;
export function useSession(
  tokenSource: TokenSourceConfigurable | TokenSourceFixed,
  options: UseSessionConfigurableOptions | UseSessionFixedOptions = {},
): UseSessionReturn {
  const {
    agentConnectTimeoutMilliseconds,
    room,
    encryption,
    textBaseUrl,
    threadId,
    ...tokenFetchOptions
  } = options;

  // The durable conversation half. The cast lets the one impl path call the overloaded `useThread`
  // with a union tokenSource; `useThread` branches on `instanceof TokenSourceConfigurable` at runtime,
  // so a fixed source is handled correctly regardless.
  const thread = useThread(tokenSource as TokenSourceConfigurable, {
    textBaseUrl,
    threadId,
    ...tokenFetchOptions,
  });

  // The live media/room half, attached to the thread.
  const call = useCall(thread, {
    agentConnectTimeoutMilliseconds,
    room,
    encryption,
  } as UseCallOptions);

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

  // The public end: stop the call, then tear down the thread's text transport (matches the former
  // media-stop + text-transport-disconnect behavior).
  const end = React.useCallback(async () => {
    await call.end();
    await thread.textTransport.disconnect();
  }, [call.end, thread.textTransport]);

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
