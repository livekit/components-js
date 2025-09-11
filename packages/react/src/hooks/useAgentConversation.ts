import type TypedEventEmitter from 'typed-emitter';
import { Room, RoomEvent, ConnectionState, TrackPublishOptions } from 'livekit-client';
import { EventEmitter } from 'events';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ConnectionCredentials } from '../utils/ConnectionCredentialsProvider';
import { useMaybeRoomContext } from '../context';
import { RoomAgentDispatch, RoomConfiguration } from '@livekit/protocol';
import { useAgent } from './useAgent';

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
};

export type AgentSessionConnectOptions = {
  /** Optional abort signal which if triggered will stop waiting for the room to be disconnected
    * prior to connecting
    *
    * FIXME: is this a confusing property to expose? Maybe expose one `signal` that universally
    * could apply across the whole agentSession.connect(...) call?
    */
  waitForDisconnectSignal?: AbortSignal;

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
  };
};

type ConversationStateConnecting = ConversationStateCommon & {
  connectionState: "connecting";
  isConnected: false;
  isReconnecting: false;
};

type ConversationStateConnected = ConversationStateCommon & {
  connectionState: "connected" | "reconnecting" | "signalReconnecting";
  isConnected: true;
  isReconnecting: boolean;
};

type ConversationStateDisconnected = ConversationStateCommon & {
  connectionState: "disconnected";
  isConnected: false;
  isReconnecting: false;
};

type ConversationActions = {
  /** Returns a promise that resolves once the room connects. */
  waitUntilConnected: (signal?: AbortSignal) => void;
  /** Returns a promise that resolves once the room disconnects */
  waitUntilDisconnected: (signal?: AbortSignal) => void;

  prepareConnection: () => Promise<void>,
  connect: (options?: AgentSessionConnectOptions) => Promise<void>;
  disconnect: () => Promise<void>;
};

export type ConversationInstance = (ConversationStateConnecting | ConversationStateConnected | ConversationStateDisconnected) & ConversationActions;

/**
 * AgentSession represents a connection to a LiveKit Agent, providing abstractions to make 1:1
 * agent/participant rooms easier to work with.
 */
export function useConversation(agentToDispatch: string | RoomAgentDispatch, options: ConversationOptions): ConversationInstance {
  const roomFromContext = useMaybeRoomContext();
  const room = useMemo(() => roomFromContext ?? options.room ?? new Room(), []);

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

      switch (connectionState) {
        case ConnectionState.Disconnected: {
          options.credentials.refresh();
          break;
        }
      };
    };

    room.on(RoomEvent.ConnectionStateChanged, handleConnectionStateChanged);
    return () => {
      room.off(RoomEvent.ConnectionStateChanged, handleConnectionStateChanged);
    };
  }, [room]);


  // const handleAgentAttributesChanged = () => {
  //   set((old) => generateConnectionStateUpdate(old, old.agent, old.local, old.messages));
  // };

  useEffect(() => {
    const handleMediaDevicesError = async (error: Error) => {
      emitter.emit(ConversationEvent.MediaDevicesError, error);
    };

    room.on(RoomEvent.MediaDevicesError, handleMediaDevicesError);
    return () => {
      room.off(RoomEvent.MediaDevicesError, handleMediaDevicesError);
    };
  }, [room]);

  const conversationState = useMemo((): ConversationStateConnecting | ConversationStateConnected | ConversationStateDisconnected => {
    const common: ConversationStateCommon = {
      [Symbol.toStringTag]: "AgentSessionInstance",

      subtle: {
        room,
        emitter,
        credentials: options.credentials,
      },
    };

    switch (roomConnectionState) {
      case ConnectionState.Connecting:
        return {
          ...common,

          connectionState: 'connecting',
          ...generateDerivedConnectionStateValues('connecting'),
        };

      case ConnectionState.Connected:
      case ConnectionState.Reconnecting:
      case ConnectionState.SignalReconnecting:
        return {
          ...common,

          connectionState: roomConnectionState,
          ...generateDerivedConnectionStateValues(roomConnectionState),
        };

      case ConnectionState.Disconnected:
        return {
          ...common,

          connectionState: ConnectionState.Disconnected,
          ...generateDerivedConnectionStateValues(ConnectionState.Disconnected),
        };
    }
  }, [options.credentials, room, emitter, roomConnectionState]);
  useEffect(() => {
    emitter.emit(ConversationEvent.ConnectionStateChanged, conversationState.connectionState);
  }, [conversationState.connectionState]);

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
  }, [conversationState.connectionState]);

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
    subtle: { emitter, room, credentials: options.credentials }
  }), [conversationState, emitter, room, options.credentials]), agentName);

  const connect = useCallback(async (connectOptions: AgentSessionConnectOptions = {}) => {
    const {
      waitForDisconnectSignal,
      tracks = { microphone: { enabled: true, publishOptions: { preConnectBuffer: true } } },
    } = connectOptions;

    await waitUntilDisconnected(waitForDisconnectSignal);

    await Promise.all([
      options.credentials.generate().then(connection => (
        room.connect(connection.serverUrl, connection.participantToken)
      )),

      // Start microphone (with preconnect buffer) by default
      tracks.microphone?.enabled ? (
        room.localParticipant.setMicrophoneEnabled(true, undefined, tracks.microphone?.publishOptions ?? {})
      ) : Promise.resolve(),
    ]);

    await waitUntilConnected();
    await agent.waitUntilAvailable();
  }, [room, waitUntilDisconnected, options.credentials, waitUntilConnected, agent.waitUntilAvailable]);

  const disconnect = useCallback(async () => {
    await room.disconnect();
  }, [room]);

  const prepareConnection = useCallback(async () => {
    const credentials = await options.credentials.generate();
    await room.prepareConnection(credentials.serverUrl, credentials.participantToken);
  }, [room]);
  prepareConnection().catch(err => {
    // FIXME: figure out a better logging solution?
    console.warn('WARNING: Room.prepareConnection failed:', err);
  });

  return useMemo(() => ({
    ...conversationState,

    waitUntilConnected,
    waitUntilDisconnected,

    prepareConnection,
    connect,
    disconnect,
  }), [
    conversationState,
    waitUntilConnected,
    waitUntilDisconnected,
    prepareConnection,
    connect,
    disconnect,
  ]);
}
