import * as React from 'react';
import type TypedEventEmitter from 'typed-emitter';
import {
  Room,
  RoomEvent,
  ConnectionState,
  TrackPublishOptions,
  Track,
  TokenSourceConfigurable,
  TokenSourceFixed,
  TokenSourceFetchOptions,
  RoomConnectOptions,
} from 'livekit-client';
import { EventEmitter } from 'events';

import { useMaybeRoomContext } from '../context';
import { AgentState, useAgent, useAgentTimeoutIdStore } from './useAgent';
import { TrackReference } from '@livekit/components-core';
import { useLocalParticipant } from './useLocalParticipant';

/** @public */
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

/** @public */
export type SessionCallbacks = {
  [SessionEvent.ConnectionStateChanged]: (newAgentConnectionState: ConnectionState) => void;
  [SessionEvent.MediaDevicesError]: (error: Error) => void;
  [SessionEvent.EncryptionError]: (error: Error) => void;
};

/** @public */
export type SessionConnectOptions = {
  /** Optional abort signal which if triggered will terminate connecting even if it isn't complete */
  signal?: AbortSignal;

  tracks?: {
    microphone?: {
      enabled?: boolean;
      publishOptions?: TrackPublishOptions;
    };
  };

  /** Options for Room.connect(.., .., opts) */
  roomConnectOptions?: RoomConnectOptions;
};

/** @public */
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
    updateAgentTimeoutState: (agentState: AgentState) => void;
    updateAgentTimeoutParticipantExists: (agentParticipantExists: boolean) => void;
  };
};

type SessionStateConnecting = SessionStateCommon & {
  connectionState: ConnectionState.Connecting;
  isConnected: false;
  isReconnecting: false;

  local: {
    cameraTrack: null;
    microphoneTrack: null;
  };
};

type SessionStateConnected = SessionStateCommon & {
  connectionState:
    | ConnectionState.Connected
    | ConnectionState.Reconnecting
    | ConnectionState.SignalReconnecting;
  isConnected: true;
  isReconnecting: boolean;

  local: {
    cameraTrack: TrackReference | null;
    microphoneTrack: TrackReference | null;
  };
};

type SessionStateDisconnected = SessionStateCommon & {
  connectionState: ConnectionState.Disconnected;
  isConnected: false;
  isReconnecting: false;

  local: {
    cameraTrack: null;
    microphoneTrack: null;
  };
};

type SessionActions = {
  /** Returns a promise that resolves once the room connects. */
  waitUntilConnected: (signal?: AbortSignal) => void;
  /** Returns a promise that resolves once the room disconnects */
  waitUntilDisconnected: (signal?: AbortSignal) => void;

  prepareConnection: () => Promise<void>;

  /** Connect to the underlying room and dispatch any agents */
  start: (options?: SessionConnectOptions) => Promise<void>;

  /** Disconnect from the underlying room */
  end: () => Promise<void>;
};

/** @public */
export type UseSessionReturn = (
  | SessionStateConnecting
  | SessionStateConnected
  | SessionStateDisconnected
) &
  SessionActions;

type UseSessionCommonOptions = {
  room?: Room;

  /**
   * Amount of time in milliseonds the system will wait for an agent to join the room, before
   * transitioning to the "failure" state.
   */
  agentConnectTimeoutMilliseconds?: number;
};

type UseSessionConfigurableOptions = UseSessionCommonOptions & TokenSourceFetchOptions;
type UseSessionFixedOptions = UseSessionCommonOptions;

/**
 * A Session represents a manages connection to a Room which can contain Agents.
 * @public
 */
export function useSession(
  tokenSource: TokenSourceConfigurable,
  options?: UseSessionConfigurableOptions,
): UseSessionReturn;
/**
 * A Session represents a manages connection to a Room which can contain Agents.
 * @public
 */
export function useSession(
  tokenSource: TokenSourceFixed,
  options?: UseSessionFixedOptions,
): UseSessionReturn;
export function useSession(
  tokenSource: TokenSourceConfigurable | TokenSourceFixed,
  options: UseSessionConfigurableOptions | UseSessionFixedOptions = {},
): UseSessionReturn {
  const { room: optionsRoom, agentConnectTimeoutMilliseconds, ...restOptions } = options;

  const roomFromContext = useMaybeRoomContext();
  const room = React.useMemo(
    () => roomFromContext ?? optionsRoom ?? new Room(),
    [roomFromContext, optionsRoom],
  );

  const emitter = React.useMemo(
    () => new EventEmitter() as TypedEventEmitter<SessionCallbacks>,
    [],
  );

  const generateDerivedConnectionStateValues = React.useCallback(
    <State extends UseSessionReturn['connectionState']>(connectionState: State) =>
      ({
        isConnected:
          connectionState === ConnectionState.Connected ||
          connectionState === ConnectionState.Reconnecting ||
          connectionState === ConnectionState.SignalReconnecting,
        isReconnecting:
          connectionState === ConnectionState.Reconnecting ||
          connectionState === ConnectionState.SignalReconnecting,
      }) as {
        isConnected: State extends
          | ConnectionState.Connected
          | ConnectionState.Reconnecting
          | ConnectionState.SignalReconnecting
          ? true
          : false;
        isReconnecting: State extends
          | ConnectionState.Reconnecting
          | ConnectionState.SignalReconnecting
          ? true
          : false;
      },
    [],
  );

  const [roomConnectionState, setRoomConnectionState] = React.useState(room.state);
  React.useEffect(() => {
    const handleConnectionStateChanged = (connectionState: ConnectionState) => {
      setRoomConnectionState(connectionState);
    };

    room.on(RoomEvent.ConnectionStateChanged, handleConnectionStateChanged);
    return () => {
      room.off(RoomEvent.ConnectionStateChanged, handleConnectionStateChanged);
    };
  }, [room]);

  React.useEffect(() => {
    const handleMediaDevicesError = async (error: Error) => {
      emitter.emit(SessionEvent.MediaDevicesError, error);
    };

    room.on(RoomEvent.MediaDevicesError, handleMediaDevicesError);
    return () => {
      room.off(RoomEvent.MediaDevicesError, handleMediaDevicesError);
    };
  }, [room, emitter]);

  React.useEffect(() => {
    const handleEncryptionError = async (error: Error) => {
      emitter.emit(SessionEvent.EncryptionError, error);
    };

    room.on(RoomEvent.EncryptionError, handleEncryptionError);
    return () => {
      room.off(RoomEvent.EncryptionError, handleEncryptionError);
    };
  }, [room, emitter]);

  const { localParticipant } = useLocalParticipant({ room });
  const cameraPublication = localParticipant.getTrackPublication(Track.Source.Camera);
  const localCamera = React.useMemo(() => {
    if (!cameraPublication || cameraPublication.isMuted) {
      return null;
    }
    return {
      source: Track.Source.Camera,
      participant: localParticipant,
      publication: cameraPublication,
    };
  }, [localParticipant, cameraPublication, cameraPublication?.isMuted]);
  const microphonePublication = localParticipant.getTrackPublication(Track.Source.Microphone);
  const localMicrophone = React.useMemo(() => {
    if (!microphonePublication || microphonePublication.isMuted) {
      return null;
    }
    return {
      source: Track.Source.Microphone,
      participant: localParticipant,
      publication: microphonePublication,
    };
  }, [localParticipant, microphonePublication, microphonePublication?.isMuted]);

  const {
    agentTimeoutFailureReason,
    startAgentTimeout,
    clearAgentTimeout,
    updateAgentTimeoutState,
    updateAgentTimeoutParticipantExists,
  } = useAgentTimeoutIdStore();

  const sessionInternal: UseSessionReturn['internal'] = React.useMemo(
    () => ({
      emitter,
      tokenSource,
      agentConnectTimeoutMilliseconds,

      agentTimeoutFailureReason,
      startAgentTimeout,
      clearAgentTimeout,
      updateAgentTimeoutState,
      updateAgentTimeoutParticipantExists,
    }),
    [
      emitter,
      agentConnectTimeoutMilliseconds,
      tokenSource,
      agentTimeoutFailureReason,
      startAgentTimeout,
      clearAgentTimeout,
      updateAgentTimeoutState,
      updateAgentTimeoutParticipantExists,
    ],
  );

  const conversationState = React.useMemo(():
    | SessionStateConnecting
    | SessionStateConnected
    | SessionStateDisconnected => {
    const common: SessionStateCommon = {
      room,
      internal: sessionInternal,
    };

    switch (roomConnectionState) {
      case ConnectionState.Connecting:
        return {
          ...common,

          connectionState: ConnectionState.Connecting,
          ...generateDerivedConnectionStateValues(ConnectionState.Connecting),

          local: {
            cameraTrack: null,
            microphoneTrack: null,
          },
        };

      case ConnectionState.Connected:
      case ConnectionState.Reconnecting:
      case ConnectionState.SignalReconnecting:
        return {
          ...common,

          connectionState: roomConnectionState,
          ...generateDerivedConnectionStateValues(roomConnectionState),

          local: {
            cameraTrack: localCamera,
            microphoneTrack: localMicrophone,
          },
        };

      case ConnectionState.Disconnected:
        return {
          ...common,

          connectionState: ConnectionState.Disconnected,
          ...generateDerivedConnectionStateValues(ConnectionState.Disconnected),

          local: {
            cameraTrack: null,
            microphoneTrack: null,
          },
        };
    }
  }, [
    sessionInternal,
    room,
    emitter,
    roomConnectionState,
    localParticipant,
    localCamera,
    localMicrophone,
    generateDerivedConnectionStateValues,
  ]);
  React.useEffect(() => {
    emitter.emit(SessionEvent.ConnectionStateChanged, conversationState.connectionState);
  }, [emitter, conversationState.connectionState]);

  const waitUntilConnectionState = React.useCallback(
    async (state: UseSessionReturn['connectionState'], signal?: AbortSignal) => {
      if (conversationState.connectionState === state) {
        return;
      }

      return new Promise<void>((resolve, reject) => {
        const onceEventOccurred = (newState: UseSessionReturn['connectionState']) => {
          if (newState !== state) {
            return;
          }
          cleanup();
          resolve();
        };
        const abortHandler = () => {
          cleanup();
          reject(new Error(`AgentSession.waitUntilRoomState(${state}, ...) - signal aborted`));
        };

        const cleanup = () => {
          emitter.off(SessionEvent.ConnectionStateChanged, onceEventOccurred);
          signal?.removeEventListener('abort', abortHandler);
        };

        emitter.on(SessionEvent.ConnectionStateChanged, onceEventOccurred);
        signal?.addEventListener('abort', abortHandler);
      });
    },
    [conversationState.connectionState, emitter],
  );

  const waitUntilConnected = React.useCallback(
    async (signal?: AbortSignal) => {
      return waitUntilConnectionState(
        ConnectionState.Connected /* FIXME: should I check for other states too? */,
        signal,
      );
    },
    [waitUntilConnectionState],
  );

  const waitUntilDisconnected = React.useCallback(
    async (signal?: AbortSignal) => {
      return waitUntilConnectionState(ConnectionState.Disconnected, signal);
    },
    [waitUntilConnectionState],
  );

  const agent = useAgent(
    React.useMemo(
      () => ({
        connectionState: conversationState.connectionState,
        room,
        internal: sessionInternal,
      }),
      [conversationState, room, sessionInternal],
    ),
  );

  const tokenSourceFetch = React.useCallback(async () => {
    const isConfigurable = tokenSource instanceof TokenSourceConfigurable;
    if (isConfigurable) {
      const tokenFetchOptions = restOptions as UseSessionConfigurableOptions;
      return tokenSource.fetch(tokenFetchOptions);
    } else {
      return tokenSource.fetch();
    }
  }, [tokenSource, restOptions]);

  const start = React.useCallback(
    async (connectOptions: SessionConnectOptions = {}) => {
      const {
        signal,
        tracks = { microphone: { enabled: true, publishOptions: { preConnectBuffer: true } } },
        roomConnectOptions,
      } = connectOptions;

      await waitUntilDisconnected(signal);

      const onSignalAbort = () => {
        room.disconnect();
      };
      signal?.addEventListener('abort', onSignalAbort);

      await Promise.all([
        // FIXME: swap the below line in once the new `livekit-client` changes are published
        // room.connect(tokenSource, { tokenSourceOptions }),
        tokenSourceFetch().then(({ serverUrl, participantToken }) =>
          room.connect(serverUrl, participantToken, roomConnectOptions),
        ),

        // Start microphone (with preconnect buffer) by default
        tracks.microphone?.enabled
          ? room.localParticipant.setMicrophoneEnabled(
              true,
              undefined,
              tracks.microphone?.publishOptions ?? {},
            )
          : Promise.resolve(),
      ]);

      await waitUntilConnected(signal);
      await agent.waitUntilAvailable(signal);

      signal?.removeEventListener('abort', onSignalAbort);
    },
    [room, waitUntilDisconnected, tokenSourceFetch, waitUntilConnected, agent.waitUntilAvailable],
  );

  const end = React.useCallback(async () => {
    await room.disconnect();
  }, [room]);

  const prepareConnection = React.useCallback(async () => {
    const credentials = await tokenSourceFetch();
    // FIXME: swap the below line in once the new `livekit-client` changes are published
    // room.prepareConnection(tokenSource, { tokenSourceOptions }),
    await room.prepareConnection(credentials.serverUrl, credentials.participantToken);
  }, [tokenSourceFetch, room]);
  React.useEffect(
    () => {
      prepareConnection().catch((err) => {
        // FIXME: figure out a better logging solution?
        console.warn('WARNING: Room.prepareConnection failed:', err);
      });
    },
    [
      /* note: no prepareConnection here, this effect should only ever run once! */
    ],
  );

  return React.useMemo(
    () => ({
      ...conversationState,

      waitUntilConnected,
      waitUntilDisconnected,

      prepareConnection,
      start,
      end,
    }),
    [conversationState, waitUntilConnected, waitUntilDisconnected, prepareConnection, start, end],
  );
}
