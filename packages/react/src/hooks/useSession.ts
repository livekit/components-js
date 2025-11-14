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
  decodeTokenPayload,
} from 'livekit-client';
import { EventEmitter } from 'events';

import { useMaybeRoomContext } from '../context';
import { AgentState, useAgent, useAgentTimeoutIdStore } from './useAgent';
import { TrackReference } from '@livekit/components-core';
import { useLocalParticipant } from './useLocalParticipant';

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
  };
};

type SessionStateConnecting = SessionStateCommon & {
  connectionState: ConnectionState.Connecting;
  isConnected: false;

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

  local: {
    cameraTrack: TrackReference | null;
    microphoneTrack: TrackReference | null;
  };
};

type SessionStateDisconnected = SessionStateCommon & {
  connectionState: ConnectionState.Disconnected;
  isConnected: false;

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

/** @beta */
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

/** Internal hook used by useSession to manage creating a function which can be used to wait
 * until the session is in a given state before resolving. */
function useSessionWaitUntilConnectionState(
  emitter: TypedEventEmitter<SessionCallbacks>,
  connectionState: UseSessionReturn['connectionState'],
) {
  const connectionStateRef = React.useRef(connectionState);
  React.useEffect(() => {
    connectionStateRef.current = connectionState;
  }, [connectionState]);

  const waitUntilConnectionState = React.useCallback(
    async (state: UseSessionReturn['connectionState'], signal?: AbortSignal) => {
      if (connectionStateRef.current === state) {
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
          reject(
            new Error(
              `useSession(/* ... */).waitUntilConnectionState(${state}, /* signal */) - signal aborted`,
            ),
          );
        };

        const cleanup = () => {
          emitter.off(SessionEvent.ConnectionStateChanged, onceEventOccurred);
          signal?.removeEventListener('abort', abortHandler);
        };

        emitter.on(SessionEvent.ConnectionStateChanged, onceEventOccurred);
        signal?.addEventListener('abort', abortHandler);
      });
    },
    [emitter],
  );

  return waitUntilConnectionState;
}

/** Internal hook used by useSession to manage creating a function that properly invokes
 * tokenSource.fetch(...) with any fetch options */
function useSessionTokenSourceFetch(
  tokenSource: TokenSourceConfigurable | TokenSourceFixed,
  unstableRestOptions: Exclude<UseSessionConfigurableOptions, keyof UseSessionCommonOptions>,
) {
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

  const tokenSourceFetch = React.useCallback(async () => {
    if (isConfigurable) {
      if (!memoizedTokenFetchOptionsRef.current) {
        throw new Error(
          `AgentSession - memoized token fetch options are not set, but the passed tokenSource was an instance of TokenSourceConfigurable. If you are seeing this please make a new GitHub issue!`,
        );
      }
      return tokenSource.fetch(memoizedTokenFetchOptionsRef.current);
    } else {
      return tokenSource.fetch();
    }
  }, [isConfigurable, tokenSource]);

  return tokenSourceFetch;
}

/**
 * A Session represents a managed connection to a Room which can contain Agents.
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
      }) as {
        isConnected: State extends
          | ConnectionState.Connected
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
    clearAgentTimeoutFailureReason,
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
      clearAgentTimeoutFailureReason,
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
      clearAgentTimeoutFailureReason,
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
    roomConnectionState,
    localCamera,
    localMicrophone,
    generateDerivedConnectionStateValues,
  ]);
  React.useEffect(() => {
    emitter.emit(SessionEvent.ConnectionStateChanged, conversationState.connectionState);
  }, [emitter, conversationState.connectionState]);

  const waitUntilConnectionState = useSessionWaitUntilConnectionState(
    emitter,
    conversationState.connectionState,
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

  const tokenSourceFetch = useSessionTokenSourceFetch(tokenSource, restOptions);

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

      let tokenDispatchesAgent = false;
      await Promise.all([
        tokenSourceFetch().then(({ serverUrl, participantToken }) => {
          const participantTokenPayload = decodeTokenPayload(participantToken);
          const participantTokenAgentDispatchCount =
            participantTokenPayload.roomConfig?.agents?.length ?? 0;
          tokenDispatchesAgent = participantTokenAgentDispatchCount > 0;

          return room.connect(serverUrl, participantToken, roomConnectOptions);
        }),

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
      if (tokenDispatchesAgent) {
        await agent.waitUntilConnected(signal);
      }

      signal?.removeEventListener('abort', onSignalAbort);
    },
    [room, waitUntilDisconnected, tokenSourceFetch, waitUntilConnected, agent.waitUntilConnected],
  );

  const end = React.useCallback(async () => {
    await room.disconnect();
  }, [room]);

  const prepareConnection = React.useCallback(async () => {
    const credentials = await tokenSourceFetch();
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
