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
  RoomOptions,
} from 'livekit-client';
import { EventEmitter } from 'events';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAgent } from './useAgent';
import { log, TrackReference } from '@livekit/components-core';
import { useLocalParticipant } from './useLocalParticipant';
import { roomOptionsStringifyReplacer } from '../utils';

/** @public */
export enum SessionEvent {
  ConnectionStateChanged = 'connectionStateChanged',
  MediaDevicesError = 'MediaDevicesError',
}

/** @public */
export type SessionCallbacks = {
  [SessionEvent.ConnectionStateChanged]: (newAgentConnectionState: ConnectionState) => void;
  [SessionEvent.MediaDevicesError]: (error: Error) => void;
};

/** @public */
export type SessionConnectOptions = {
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
  /**
   * Amount of time in milliseonds the system will wait for an agent to join the room, before
   * transitioning to the "failure" state.
   */
  agentConnectTimeoutMilliseconds?: number;
};

type UseSessionFixedOptions = UseSessionCommonOptions; // & RoomOptionsTokenSourceFixed FIXME: add this!
type UseSessionConfigurableOptions = UseSessionCommonOptions & TokenSourceFetchOptions; // & RoomOptionsTokenSourceConfigurable FIXME: replace this!

/** Given two TokenSourceFetchOptions values, check to see if they are deep equal. */
function areTokenSourceFetchOptionsEqual(a: TokenSourceFetchOptions, b: TokenSourceFetchOptions) {
  for (const key of Object.keys(a) as Array<keyof TokenSourceFetchOptions>) {
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

function extractTokenSourceFetchOptionsFromObject<
  Rest extends object,
  Input extends TokenSourceFetchOptions & Rest = TokenSourceFetchOptions & Rest,
>(input: Input): [TokenSourceFetchOptions, Rest] {
  const output: Partial<Input> = { ...input };
  const options: TokenSourceFetchOptions = {};

  for (const key of Object.keys(input) as Array<keyof TokenSourceFetchOptions>) {
    switch (key) {
      case 'roomName':
      case 'participantName':
      case 'participantIdentity':
      case 'participantMetadata':
      case 'agentName':
      case 'agentMetadata':
        options[key] = input[key];
        delete output[key];
        break;

      case 'participantAttributes':
        options.participantAttributes = options.participantAttributes ?? {};
        delete output.participantAttributes;
        break;

      default:
        // ref: https://stackoverflow.com/a/58009992
        key satisfies never;
        break;
    }
  }

  return [options, output as Rest];
}

function areRoomOptionsEqual(a: RoomOptions, b: RoomOptions) {
  const [tokenSourceFetchOptionsA, restRoomOptionsA] = extractTokenSourceFetchOptionsFromObject(a);
  const [tokenSourceFetchOptionsB, restRoomOptionsB] = extractTokenSourceFetchOptionsFromObject(b);

  if (!areTokenSourceFetchOptionsEqual(tokenSourceFetchOptionsA, tokenSourceFetchOptionsB)) {
    return false;
  }

  // FIXME: do this in a better way maybe?
  // I stole this existing approach from useLiveKitRoom
  const restRoomOptionsAHash = JSON.stringify(restRoomOptionsA, roomOptionsStringifyReplacer);
  const restRoomOptionsBHash = JSON.stringify(restRoomOptionsB, roomOptionsStringifyReplacer);
  if (restRoomOptionsAHash !== restRoomOptionsBHash) {
    return false;
  }

  return true;
}

/**
 * A Session represents a manages connection to a Room which can contain Agents.
 * @public
 */
export function useSession(
  tokenSource: TokenSourceConfigurable,
  options?: UseSessionConfigurableOptions,
): UseSessionReturn;
export function useSession(
  tokenSource: TokenSourceFixed,
  options?: UseSessionFixedOptions,
): UseSessionReturn;
export function useSession(
  tokenSource: TokenSourceConfigurable | TokenSourceFixed,
  options: UseSessionConfigurableOptions | UseSessionFixedOptions = {},
): UseSessionReturn {
  const { agentConnectTimeoutMilliseconds, ...restOptions } = options;

  const roomOptions: RoomOptions = useMemo(() => {
    if (tokenSource instanceof TokenSourceConfigurable) {
      return { tokenSource, ...restOptions }; // as RoomOptionsTokenSourceConfigurable FIXME: add this!
    } else if (tokenSource instanceof TokenSourceFixed) {
      return { tokenSource, ...restOptions }; // as RoomOptionsTokenSourceFixed FIXME: add this!
    } else {
      throw new Error(
        'Specified token source is neither fixed nor configurable - is this value valid?',
      );
    }
  }, [tokenSource, restOptions]);

  const [sessionActive, setSessionActive] = useState(false);

  const previousRoomOptions = useRef(roomOptions);
  const previousRoomValue = useRef<Room | null>(null);
  const room = useMemo(() => {
    const roomOptionsEqual = areRoomOptionsEqual(previousRoomOptions.current, roomOptions);

    if (previousRoomValue.current) {
      if (!roomOptionsEqual && sessionActive) {
        log.warn(
          "Warning: useSession tokenSource / options parameters changed while session is active - this won't do anything. If you are intending to change room options, stop the session first with `session.stop()`.",
        );
        return previousRoomValue.current;
      }
      if (roomOptionsEqual) {
        return previousRoomValue.current;
      }
    }

    const room = new Room(roomOptions);
    previousRoomValue.current = room;
    previousRoomOptions.current = roomOptions;
    return room;
  }, [roomOptions]);

  const emitter = useMemo(() => new EventEmitter() as TypedEventEmitter<SessionCallbacks>, []);

  const generateDerivedConnectionStateValues = useCallback(
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

  const conversationState = useMemo(():
    | SessionStateConnecting
    | SessionStateConnected
    | SessionStateDisconnected => {
    const common: SessionStateCommon = {
      room,
      internal: {
        emitter,
        tokenSource,
        agentConnectTimeoutMilliseconds,
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
    tokenSource,
    agentConnectTimeoutMilliseconds,
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

  const waitUntilConnectionState = useCallback(
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

  const waitUntilConnected = useCallback(
    async (signal?: AbortSignal) => {
      return waitUntilConnectionState(
        ConnectionState.Connected /* FIXME: should I check for other states too? */,
        signal,
      );
    },
    [waitUntilConnectionState],
  );

  const waitUntilDisconnected = useCallback(
    async (signal?: AbortSignal) => {
      return waitUntilConnectionState(ConnectionState.Disconnected, signal);
    },
    [waitUntilConnectionState],
  );

  const agent = useAgent(
    useMemo(
      () => ({
        connectionState: conversationState.connectionState,
        room,
        internal: {
          emitter,
          tokenSource,
        },
      }),
      [conversationState, emitter, room, tokenSource],
    ),
  );

  const tokenSourceFetch = useCallback(() => {
    const isConfigurable = tokenSource instanceof TokenSourceConfigurable;
    if (isConfigurable) {
      return tokenSource.fetch(restOptions);
    } else {
      return tokenSource.fetch();
    }
  }, [tokenSource, restOptions]);

  const end = useCallback(async () => {
    setSessionActive(false);
    await room.disconnect();
  }, [setSessionActive, room]);

  const start = useCallback(
    async (connectOptions: SessionConnectOptions = {}) => {
      const {
        signal,
        tracks = { microphone: { enabled: true, publishOptions: { preConnectBuffer: true } } },
      } = connectOptions;

      await waitUntilDisconnected(signal);

      setSessionActive(true);
      const onSignalAbort = () => end();
      signal?.addEventListener('abort', onSignalAbort);

      await Promise.all([
        // FIXME: swap the below line in once the new `livekit-client` changes are published
        // room.connect(),
        tokenSourceFetch().then(({ serverUrl, participantToken }) =>
          room.connect(serverUrl, participantToken),
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
    [
      room,
      waitUntilDisconnected,
      tokenSourceFetch,
      waitUntilConnected,
      agent.waitUntilAvailable,
      end,
    ],
  );

  const prepareConnection = useCallback(async () => {
    const credentials = await tokenSourceFetch();
    // FIXME: swap the below line in once the new `livekit-client` changes are published
    // await room.prepareConnection(),
    await room.prepareConnection(credentials.serverUrl, credentials.participantToken);
  }, [tokenSourceFetch, room]);
  useEffect(() => {
    prepareConnection().catch((err) => {
      log.warn('Room.prepareConnection failed:', err);
    });
  }, [prepareConnection]);

  return useMemo(
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
