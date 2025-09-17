import type TypedEventEmitter from 'typed-emitter';
import { Room, RoomEvent, ConnectionState, TrackPublishOptions, Track, LocalParticipant } from 'livekit-client';
import { EventEmitter } from 'events';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ConnectionCredentials } from '../utils/ConnectionCredentialsProvider';
import { useMaybeRoomContext } from '../context';
import { RoomAgentDispatch, RoomConfiguration } from '@livekit/protocol';
import { useAgent } from './useAgent';
import { TrackReferenceOrPlaceholder, TrackReferencePlaceholder } from '@livekit/components-core';
import { useLocalParticipant } from './useLocalParticipant';

/** State representing the current connection status to the server hosted agent */
// FIXME: maybe just make this ConnectionState?
export type AgentSessionConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'signalReconnecting';

export enum ConversationEvent {
  ConnectionStateChanged = 'connectionStateChanged',
  MediaDevicesError = 'MediaDevicesError',
}

export type ConversationCallbacks = {
  [ConversationEvent.ConnectionStateChanged]: (newAgentConnectionState: AgentSessionConnectionState) => void;
  [ConversationEvent.MediaDevicesError]: (error: Error) => void;
};

export type ConversationOptions = {
  credentials: ConnectionCredentials;
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

type ConversationStateCommon = {
  [Symbol.toStringTag]: "AgentSessionInstance",

  subtle: {
    emitter: TypedEventEmitter<ConversationCallbacks>;
    room: Room;
    credentials: ConnectionCredentials,
    agentConnectTimeoutMilliseconds: NonNullable<ConversationOptions["dispatch"]>["agentConnectTimeoutMilliseconds"],
  };
};

type ConversationStateConnecting = ConversationStateCommon & {
  connectionState: "connecting";
  isConnected: false;
  isReconnecting: false;

  local: {
    camera: TrackReferencePlaceholder<Track.Source.Camera, LocalParticipant>;
    microphone: TrackReferencePlaceholder<Track.Source.Microphone, LocalParticipant>;
  };
};

type ConversationStateConnected = ConversationStateCommon & {
  connectionState: "connected" | "reconnecting" | "signalReconnecting";
  isConnected: true;
  isReconnecting: boolean;

  local: {
    camera: TrackReferenceOrPlaceholder<Track.Source.Camera, LocalParticipant>,
    microphone: TrackReferenceOrPlaceholder<Track.Source.Microphone, LocalParticipant>,
  };
};

type ConversationStateDisconnected = ConversationStateCommon & {
  connectionState: "disconnected";
  isConnected: false;
  isReconnecting: false;

  local: {
    camera: TrackReferencePlaceholder<Track.Source.Camera, LocalParticipant>;
    microphone: TrackReferencePlaceholder<Track.Source.Microphone, LocalParticipant>;
  };
};

type ConversationActions = {
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

export type ConversationInstance = (ConversationStateConnecting | ConversationStateConnected | ConversationStateDisconnected) & ConversationActions;

/**
 * AgentSession represents a connection to a LiveKit Agent, providing abstractions to make 1:1
 * agent/participant rooms easier to work with.
 */
export function useConversationWith(agentToDispatch: string | RoomAgentDispatch, options: ConversationOptions): ConversationInstance {
  const roomFromContext = useMaybeRoomContext();
  const room = useMemo(() => roomFromContext ?? options.room ?? new Room(), [roomFromContext, options.room]);

  const emitter = useMemo(() => new EventEmitter() as TypedEventEmitter<ConversationCallbacks>, []);

  const agentName = typeof agentToDispatch === 'string' ? agentToDispatch : agentToDispatch.agentName;
  useEffect(() => {
    const agentDispatch = typeof agentToDispatch === 'string' ? (
      new RoomAgentDispatch({ agentName: agentToDispatch, metadata: '' })
    ) : agentToDispatch;
    options.credentials.setRequest({
      roomConfig: new RoomConfiguration({
        agents: [agentDispatch],
      }),
    });

    return () => {
      options.credentials.clearRequest();
    };
  }, [options.credentials]);

  const generateDerivedConnectionStateValues = <ConnectionState extends ConversationInstance["connectionState"]>(connectionState: ConnectionState) => ({
    isConnected: (
      connectionState === 'connected' ||
      connectionState === 'reconnecting' ||
      connectionState === 'signalReconnecting'
    ),
    isReconnecting: (
      connectionState === 'reconnecting' ||
      connectionState === 'signalReconnecting'
    ),
  } as {
    isConnected: ConnectionState extends 'connected' | 'reconnecting' | 'signalReconnecting' ? true : false,
    isReconnecting: ConnectionState extends 'reconnecting' | 'signalReconnecting' ? true : false,
  });

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
      emitter.emit(ConversationEvent.MediaDevicesError, error);
    };

    room.on(RoomEvent.MediaDevicesError, handleMediaDevicesError);
    return () => {
      room.off(RoomEvent.MediaDevicesError, handleMediaDevicesError);
    };
  }, [room, emitter]);

  const { localParticipant } = useLocalParticipant({ room });
  const cameraPublication = localParticipant.getTrackPublication(Track.Source.Camera);
  const localCamera = useMemo(() => {
    return !cameraPublication?.isMuted ? { source: Track.Source.Camera as const, participant: localParticipant, publication: cameraPublication } : null;
  }, [localParticipant, cameraPublication, cameraPublication?.isMuted]);
  const microphonePublication = localParticipant.getTrackPublication(Track.Source.Microphone);
  const localMicrophone = useMemo(() => {
    return !microphonePublication?.isMuted ? { source: Track.Source.Microphone as const, participant: localParticipant, publication: microphonePublication } : null;
  }, [localParticipant, microphonePublication, microphonePublication?.isMuted]);

  const conversationState = useMemo((): ConversationStateConnecting | ConversationStateConnected | ConversationStateDisconnected => {
    const common: ConversationStateCommon = {
      [Symbol.toStringTag]: "AgentSessionInstance",

      subtle: {
        room,
        emitter,
        credentials: options.credentials,
        agentConnectTimeoutMilliseconds: options.dispatch?.agentConnectTimeoutMilliseconds,
      },
    };

    switch (roomConnectionState) {
      case ConnectionState.Connecting:
        return {
          ...common,

          connectionState: 'connecting',
          ...generateDerivedConnectionStateValues('connecting'),

          local: {
            camera: { participant: localParticipant, source: Track.Source.Camera },
            microphone: { participant: localParticipant, source: Track.Source.Microphone },
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
            camera: localCamera ?? { participant: localParticipant, source: Track.Source.Camera },
            microphone: localMicrophone ?? { participant: localParticipant, source: Track.Source.Microphone },
          },
        };

      case ConnectionState.Disconnected:
        return {
          ...common,

          connectionState: ConnectionState.Disconnected,
          ...generateDerivedConnectionStateValues(ConnectionState.Disconnected),

          local: {
            camera: { participant: localParticipant, source: Track.Source.Camera },
            microphone: { participant: localParticipant, source: Track.Source.Microphone },
          },
        };
    }
  }, [options.credentials, room, emitter, roomConnectionState, localParticipant, localCamera, localMicrophone]);
  useEffect(() => {
    emitter.emit(ConversationEvent.ConnectionStateChanged, conversationState.connectionState);
  }, [emitter, conversationState.connectionState]);

  const waitUntilConnectionState = useCallback(async (state: ConversationInstance["connectionState"], signal?: AbortSignal) => {
    if (conversationState.connectionState === state) {
      return;
    }

    return new Promise<void>((resolve, reject) => {
      const onceEventOccurred = (newState: ConversationInstance["connectionState"]) => {
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
        emitter.off(ConversationEvent.ConnectionStateChanged, onceEventOccurred);
        signal?.removeEventListener('abort', abortHandler);
      };

      emitter.on(ConversationEvent.ConnectionStateChanged, onceEventOccurred);
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
      credentials: options.credentials,
      agentConnectTimeoutMilliseconds: options.dispatch?.agentConnectTimeoutMilliseconds,
    },
  }), [conversationState, emitter, room, options.credentials, options.dispatch?.agentConnectTimeoutMilliseconds]), agentName);

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
      options.credentials.generate().then(({ serverUrl, participantToken }) => (
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
  }, [room, waitUntilDisconnected, options.credentials, waitUntilConnected, agent.waitUntilAvailable]);

  const end = useCallback(async () => {
    await room.disconnect();
  }, [room]);

  const prepareConnection = useCallback(async () => {
    const credentials = await options.credentials.generate();
    await room.prepareConnection(credentials.serverUrl, credentials.participantToken);
  }, [options.credentials, room]);
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
