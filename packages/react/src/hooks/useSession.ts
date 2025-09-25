import type TypedEventEmitter from 'typed-emitter';
import { Room, RoomEvent, ConnectionState, TrackPublishOptions, Track } from 'livekit-client';
import { EventEmitter } from 'events';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { TokenSource } from '../TokenSource';
import { useMaybeRoomContext } from '../context';
import { RoomAgentDispatch, RoomConfiguration } from '@livekit/protocol';
import { useAgent } from './useAgent';
import { TrackReference } from '@livekit/components-core';
import { useLocalParticipant } from './useLocalParticipant';

export enum SessionEvent {
  ConnectionStateChanged = 'connectionStateChanged',
  MediaDevicesError = 'MediaDevicesError',
}

export type SessionCallbacks = {
  [SessionEvent.ConnectionStateChanged]: (newAgentConnectionState: ConnectionState) => void;
  [SessionEvent.MediaDevicesError]: (error: Error) => void;
};

export type SessionOptions = {
  tokenSource: TokenSource;
  agentToDispatch?: string | RoomAgentDispatch;

  room?: Room;

  dispatch?: {
    /**
      * Amount of time in milliseonds the system will wait for an agent to join the room, before
      * transitioning to the "failure" state.
      */
    agentConnectTimeoutMilliseconds?: number;
  },
};

export type AgentSessionConnectOptions = {
  /** Optional abort signal which if triggered will terminate connecting even if it isn't complete */
  signal?: AbortSignal;

  // FIXME: not sure about this pattern, background thinking is that it would be good to be able to
  // abstract away enabling relevant media tracks to the caller so they don't have to interface with
  // the room.
  tracks?: {
    microphone?: {
      enabled?: boolean;
      publishOptions?: TrackPublishOptions;
    };
  };
};


export type SwitchActiveDeviceOptions = {
  /**
   *  If true, adds an `exact` constraint to the getUserMedia request.
   *  The request will fail if this option is true and the device specified is not actually available
   */
  exact?: boolean;
};

type SessionStateCommon = {
  subtle: {
    emitter: TypedEventEmitter<SessionCallbacks>;
    room: Room;
    credentials: TokenSource,
    agentConnectTimeoutMilliseconds: NonNullable<SessionOptions["dispatch"]>["agentConnectTimeoutMilliseconds"],
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
  connectionState: ConnectionState.Connected | ConnectionState.Reconnecting | ConnectionState.SignalReconnecting;
  isConnected: true;
  isReconnecting: boolean;

  local: {
    cameraTrack: TrackReference | null,
    microphoneTrack: TrackReference | null,
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

  prepareConnection: () => Promise<void>,

  /** Connect to the underlying room and dispatch any agents */
  start: (options?: AgentSessionConnectOptions) => Promise<void>;

  /** Disconnect from the underlying room */
  end: () => Promise<void>;
};

export type UseSessionReturn = (SessionStateConnecting | SessionStateConnected | SessionStateDisconnected) & SessionActions;

/**
 * A Session represents a connection to a LiveKit Agent, providing abstractions to make 1:1
 * agent/participant rooms easier to work with.
 */
export function useSession(options: SessionOptions): UseSessionReturn {
  const roomFromContext = useMaybeRoomContext();
  const room = useMemo(() => roomFromContext ?? options.room ?? new Room(), [roomFromContext, options.room]);

  const emitter = useMemo(() => new EventEmitter() as TypedEventEmitter<SessionCallbacks>, []);

  const agentName = typeof options.agentToDispatch === 'string' ? options.agentToDispatch : options.agentToDispatch?.agentName;
  useEffect(() => {
    const roomAgentDispatch = typeof options.agentToDispatch === 'string' ? (
      new RoomAgentDispatch({ agentName: options.agentToDispatch, metadata: '' })
    ) : options.agentToDispatch;
    const roomConfig = roomAgentDispatch ? (
      new RoomConfiguration({
        agents: [roomAgentDispatch],
      })
    ) : undefined;
    options.tokenSource.setRequest({ roomConfig });

    return () => {
      options.tokenSource.clearRequest();
    };
  }, [options.tokenSource]);

  const generateDerivedConnectionStateValues = useCallback(<State extends UseSessionReturn["connectionState"]>(connectionState: State) => ({
    isConnected: (
      connectionState === ConnectionState.Connected ||
      connectionState === ConnectionState.Reconnecting ||
      connectionState === ConnectionState.SignalReconnecting
    ),
    isReconnecting: (
      connectionState === ConnectionState.Reconnecting ||
      connectionState === ConnectionState.SignalReconnecting
    ),
  } as {
    isConnected: State extends ConnectionState.Connected | ConnectionState.Reconnecting | ConnectionState.SignalReconnecting ? true : false,
    isReconnecting: State extends ConnectionState.Reconnecting | ConnectionState.SignalReconnecting ? true : false,
  }), []);

  const [roomConnectionState, setRoomConnectionState] = useState(room.state);
  useEffect(() => {
    const handleConnectionStateChanged = (connectionState: ConnectionState) => {
      setRoomConnectionState(connectionState);
    };

    room.on(RoomEvent.ConnectionStateChanged, handleConnectionStateChanged);
    return () => {
      room.off(RoomEvent.ConnectionStateChanged, handleConnectionStateChanged);
    };
  }, [room]);

  useEffect(() => {
    const handleMediaDevicesError = async (error: Error) => {
      emitter.emit(SessionEvent.MediaDevicesError, error);
    };

    room.on(RoomEvent.MediaDevicesError, handleMediaDevicesError);
    return () => {
      room.off(RoomEvent.MediaDevicesError, handleMediaDevicesError);
    };
  }, [room, emitter]);

  const { localParticipant } = useLocalParticipant({ room });
  const cameraPublication = localParticipant.getTrackPublication(Track.Source.Camera);
  const localCamera = useMemo(() => {
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
  const localMicrophone = useMemo(() => {
    if (!microphonePublication || microphonePublication.isMuted) {
      return null;
    }
    return {
      source: Track.Source.Microphone,
      participant: localParticipant,
      publication: microphonePublication,
    };
  }, [localParticipant, microphonePublication, microphonePublication?.isMuted]);

  const conversationState = useMemo((): SessionStateConnecting | SessionStateConnected | SessionStateDisconnected => {
    const common: SessionStateCommon = {
      subtle: {
        room,
        emitter,
        credentials: options.tokenSource,
        agentConnectTimeoutMilliseconds: options.dispatch?.agentConnectTimeoutMilliseconds,
      },
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
    options.tokenSource,
    room,
    emitter,
    roomConnectionState,
    localParticipant,
    localCamera,
    localMicrophone,
    generateDerivedConnectionStateValues,
  ]);
  useEffect(() => {
    emitter.emit(SessionEvent.ConnectionStateChanged, conversationState.connectionState);
  }, [emitter, conversationState.connectionState]);

  const waitUntilConnectionState = useCallback(async (state: UseSessionReturn["connectionState"], signal?: AbortSignal) => {
    if (conversationState.connectionState === state) {
      return;
    }

    return new Promise<void>((resolve, reject) => {
      const onceEventOccurred = (newState: UseSessionReturn["connectionState"]) => {
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
  }, [conversationState.connectionState, emitter]);

  const waitUntilConnected = useCallback(async (signal?: AbortSignal) => {
    return waitUntilConnectionState(
      ConnectionState.Connected, /* FIXME: should I check for other states too? */
      signal,
    );
  }, [waitUntilConnectionState]);

  const waitUntilDisconnected = useCallback(async (signal?: AbortSignal) => {
    return waitUntilConnectionState(
      ConnectionState.Disconnected,
      signal,
    );
  }, [waitUntilConnectionState]);

  const agent = useAgent(useMemo(() => ({
    connectionState: conversationState.connectionState,
    subtle: {
      emitter,
      room,
      credentials: options.tokenSource,
      agentConnectTimeoutMilliseconds: options.dispatch?.agentConnectTimeoutMilliseconds,
    },
  }), [conversationState, emitter, room, options.tokenSource, options.dispatch?.agentConnectTimeoutMilliseconds]), agentName);

  const start = useCallback(async (connectOptions: AgentSessionConnectOptions = {}) => {
    const {
      signal,
      tracks = { microphone: { enabled: true, publishOptions: { preConnectBuffer: true } } },
    } = connectOptions;

    await waitUntilDisconnected(signal);

    const onSignalAbort = () => {
      room.disconnect();
    };
    signal?.addEventListener('abort', onSignalAbort);

    await Promise.all([
      // FIXME: swap the below line in once the new `livekit-client` changes are published
      // room.connect(options.credentials),
      options.tokenSource.generate().then(({ serverUrl, participantToken }) => (
        room.connect(serverUrl, participantToken)
      )),

      // Start microphone (with preconnect buffer) by default
      tracks.microphone?.enabled ? (
        room.localParticipant.setMicrophoneEnabled(true, undefined, tracks.microphone?.publishOptions ?? {})
      ) : Promise.resolve(),
    ]);

    await waitUntilConnected(signal);
    await agent.waitUntilAvailable(signal);

    signal?.removeEventListener('abort', onSignalAbort);
  }, [room, waitUntilDisconnected, options.tokenSource, waitUntilConnected, agent.waitUntilAvailable]);

  const end = useCallback(async () => {
    await room.disconnect();
  }, [room]);

  const prepareConnection = useCallback(async () => {
    const credentials = await options.tokenSource.generate();
    await room.prepareConnection(credentials.serverUrl, credentials.participantToken);
  }, [options.tokenSource, room]);
  useEffect(() => {
    prepareConnection().catch(err => {
      // FIXME: figure out a better logging solution?
      console.warn('WARNING: Room.prepareConnection failed:', err);
    });
  }, [prepareConnection]);

  return useMemo(() => ({
    ...conversationState,

    waitUntilConnected,
    waitUntilDisconnected,

    prepareConnection,
    start,
    end,
  }), [
    conversationState,
    waitUntilConnected,
    waitUntilDisconnected,
    prepareConnection,
    start,
    end,
  ]);
}
