import * as React from 'react';
import type TypedEventEmitter from 'typed-emitter';
import {
  Room,
  RoomEvent,
  ConnectionState,
  TrackPublishOptions,
  Track,
  RoomConnectOptions,
  decodeTokenPayload,
  BaseKeyProvider,
  RoomOptions,
  ExternalE2EEKeyProvider,
  type BaseE2EEManager,
} from 'livekit-client';
import { EventEmitter } from 'events';
import {
  TrackReference,
  TextStreamData,
  ReceivedUserTranscriptionMessage,
  ReceivedAgentTranscriptionMessage,
  log,
} from '@livekit/components-core';

import { useMaybeRoomContext } from '../context';
import { useEnsureThread } from '../context/thread-context';
import { useAgent, useAgentTimeoutIdStore, type AgentState } from './useAgent';
import { useLocalParticipant } from './useLocalParticipant';
import { useTranscriptions } from './useTranscriptions';
import { isUseThreadReturn, type AgentHost, type UseThreadReturn } from './useThread';

/** @beta */
export enum CallEvent {
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
export type CallCallbacks = {
  [CallEvent.ConnectionStateChanged]: (newConnectionState: ConnectionState) => void;
  [CallEvent.MediaDevicesError]: (error: Error) => void;
  [CallEvent.EncryptionError]: (error: Error) => void;
};

/** @beta */
export type CallConnectOptions = {
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

type CallStateCommon = {
  room: Room;
  internal: {
    emitter: TypedEventEmitter<CallCallbacks>;
    agentConnectTimeoutMilliseconds?: number;

    agentTimeoutFailureReason: string | null;
    startAgentTimeout: (agentConnectTimeoutMilliseconds?: number) => void;
    clearAgentTimeout: () => void;
    clearAgentTimeoutFailureReason: () => void;
    updateAgentTimeoutState: (agentState: AgentState) => void;
    updateAgentTimeoutParticipantExists: (agentParticipantExists: boolean) => void;
  };
};

type CallStateConnecting = CallStateCommon & {
  connectionState: ConnectionState.Connecting;
  isConnected: false;

  local: {
    cameraTrack: undefined;
    microphoneTrack: undefined;
    screenShareTrack: undefined;
  };
};

type CallStateConnected = CallStateCommon & {
  connectionState:
    | ConnectionState.Connected
    | ConnectionState.Reconnecting
    | ConnectionState.SignalReconnecting;
  isConnected: true;

  local: {
    cameraTrack?: TrackReference;
    microphoneTrack?: TrackReference;
    screenShareTrack?: TrackReference;
  };
};

type CallStateDisconnected = CallStateCommon & {
  connectionState: ConnectionState.Disconnected;
  isConnected: false;

  local: {
    cameraTrack: undefined;
    microphoneTrack: undefined;
    screenShareTrack: undefined;
  };
};

type CallActions = {
  /** Returns a promise that resolves once the room connects. */
  waitUntilConnected: (signal?: AbortSignal) => Promise<void>;
  /** Returns a promise that resolves once the room disconnects */
  waitUntilDisconnected: (signal?: AbortSignal) => Promise<void>;

  prepareConnection: () => Promise<void>;

  /** Connect to the underlying room and dispatch any agents */
  start: (options?: CallConnectOptions) => Promise<void>;

  /** Disconnect from the underlying room */
  end: () => Promise<void>;

  /** Enable or disable E2EE. */
  setEncryptionEnabled: (enabled: boolean) => Promise<void>;
};

/** @beta */
export type UseCallReturn = (CallStateConnecting | CallStateConnected | CallStateDisconnected) &
  CallActions;

type UseCallWithRoomOptions = {
  room: Room;
  encryption?: never;
};

type UseCallEncryptionOptions =
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

type UseCallWithoutRoomOptions = {
  // NOTE: This must be here to make typescript go down this discriminated union branch when
  // "room" is omitted.
  room?: never;

  /** Configuration for room-level E2EE */
  encryption?: UseCallEncryptionOptions;
};

type UseCallCommonOptions = {
  /**
   * Amount of time in milliseonds the system will wait for an agent to join the room, before
   * transitioning to the "failure" state.
   */
  agentConnectTimeoutMilliseconds?: number;
};

/** @beta */
export type UseCallOptions = UseCallCommonOptions &
  (UseCallWithRoomOptions | UseCallWithoutRoomOptions);

/**
 * A Call is a live, transient WebRTC connection (a `Room`) attached to a thread, into which the
 * thread's agent is dispatched. It owns the room, the connection state, local tracks, and the
 * start/end lifecycle; the durable conversation (text transport, message store, thread id) lives in
 * the `useThread` it is attached to.
 *
 * The thread is taken from the argument, or from `ThreadContext` when omitted (throwing if neither is
 * present, exactly like `useEnsureThread`).
 * @beta
 */
export function useCall(options?: UseCallOptions): UseCallReturn;
/**
 * A Call is a live, transient WebRTC connection (a `Room`) attached to a thread, into which the
 * thread's agent is dispatched. It owns the room, the connection state, local tracks, and the
 * start/end lifecycle; the durable conversation (text transport, message store, thread id) lives in
 * the `useThread` it is attached to.
 * @beta
 */
export function useCall(thread: UseThreadReturn, options?: UseCallOptions): UseCallReturn;
export function useCall(
  threadOrOptions?: UseThreadReturn | UseCallOptions,
  maybeOptions?: UseCallOptions,
): UseCallReturn {
  const explicitThread = isUseThreadReturn(threadOrOptions) ? threadOrOptions : undefined;
  const options: UseCallOptions =
    (isUseThreadReturn(threadOrOptions) ? maybeOptions : (threadOrOptions as UseCallOptions)) ?? {};

  const thread = useEnsureThread(explicitThread);
  const { tokenSourceFetch, messageStore, registerCall } = thread.internal;
  const threadId = thread.threadId;

  const {
    room: optionsRoom,
    agentConnectTimeoutMilliseconds,
    encryption: unstableEncryption,
  } = options;

  const encryptionE2eeManager =
    unstableEncryption && 'e2eeManager' in unstableEncryption
      ? unstableEncryption.e2eeManager
      : null;
  const encryptionKey =
    unstableEncryption && !('e2eeManager' in unstableEncryption)
      ? (unstableEncryption.key ?? null)
      : null;
  const encryptionWorker =
    unstableEncryption && !('e2eeManager' in unstableEncryption)
      ? (unstableEncryption.worker ?? null)
      : null;

  const roomFromContext = useMaybeRoomContext();

  const externalKeyProviderRef = React.useRef<ExternalE2EEKeyProvider | null>(null);

  const keyProvider = React.useMemo(() => {
    if (typeof encryptionKey === 'string' || encryptionKey instanceof ArrayBuffer) {
      if (externalKeyProviderRef.current === null) {
        externalKeyProviderRef.current = new ExternalE2EEKeyProvider();
      }
      externalKeyProviderRef.current.setKey(encryptionKey).catch((e) => log.error(e));
      return externalKeyProviderRef.current;
    } else {
      return encryptionKey;
    }
  }, [encryptionKey]);

  const room = React.useMemo(() => {
    const preGeneratedRoom = roomFromContext ?? optionsRoom;
    if (preGeneratedRoom) {
      return preGeneratedRoom;
    }

    const encryptionViaWorker = !!(keyProvider && encryptionWorker);
    const encryptionViaManager = !!encryptionE2eeManager;
    const encryptionEnabled = encryptionViaWorker || encryptionViaManager;

    const roomOptions: RoomOptions = {};
    if (encryptionViaWorker) {
      roomOptions.encryption = {
        keyProvider,
        worker: encryptionWorker,
      };
    } else if (encryptionViaManager) {
      roomOptions.encryption = {
        e2eeManager: encryptionE2eeManager,
      };
    } else if (unstableEncryption !== undefined) {
      log.warn(
        'useCall options encryption was set, but neither encryption.key with encryption.worker nor encryption.e2eeManager was provided.',
      );
    }
    const room = new Room(roomOptions);
    if (encryptionEnabled) {
      room.setE2EEEnabled(true);
    }
    return room;
  }, [roomFromContext, optionsRoom, keyProvider, encryptionWorker, encryptionE2eeManager]);

  React.useEffect(() => {
    return () => {
      room.disconnect();
    };
  }, [room]);

  const emitter = React.useMemo(() => new EventEmitter() as TypedEventEmitter<CallCallbacks>, []);

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
    emitter.emit(CallEvent.ConnectionStateChanged, roomConnectionState);
  }, [emitter, roomConnectionState]);

  React.useEffect(() => {
    const handleMediaDevicesError = async (error: Error) => {
      emitter.emit(CallEvent.MediaDevicesError, error);
    };

    room.on(RoomEvent.MediaDevicesError, handleMediaDevicesError);
    return () => {
      room.off(RoomEvent.MediaDevicesError, handleMediaDevicesError);
    };
  }, [room, emitter]);

  React.useEffect(() => {
    const handleEncryptionError = async (error: Error) => {
      emitter.emit(CallEvent.EncryptionError, error);
    };

    room.on(RoomEvent.EncryptionError, handleEncryptionError);
    return () => {
      room.off(RoomEvent.EncryptionError, handleEncryptionError);
    };
  }, [room, emitter]);

  const { localParticipant } = useLocalParticipant({ room });
  const cameraPublication = localParticipant.getTrackPublication(Track.Source.Camera);
  const localCamera = React.useMemo(() => {
    if (!cameraPublication) {
      return undefined;
    }
    return {
      source: Track.Source.Camera,
      participant: localParticipant,
      publication: cameraPublication,
    };
  }, [localParticipant, cameraPublication]);
  const microphonePublication = localParticipant.getTrackPublication(Track.Source.Microphone);
  const localMicrophone = React.useMemo(() => {
    if (!microphonePublication) {
      return undefined;
    }
    return {
      source: Track.Source.Microphone,
      participant: localParticipant,
      publication: microphonePublication,
    };
  }, [localParticipant, microphonePublication]);
  const screenSharePublication = localParticipant.getTrackPublication(Track.Source.ScreenShare);
  const localScreenShare = React.useMemo(() => {
    if (!screenSharePublication) {
      return undefined;
    }
    return {
      source: Track.Source.ScreenShare,
      participant: localParticipant,
      publication: screenSharePublication,
    };
  }, [localParticipant, screenSharePublication]);

  const {
    agentTimeoutFailureReason,
    startAgentTimeout,
    clearAgentTimeout,
    clearAgentTimeoutFailureReason,
    updateAgentTimeoutState,
    updateAgentTimeoutParticipantExists,
  } = useAgentTimeoutIdStore();

  const callInternal = React.useMemo(
    () => ({
      emitter,
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
      agentTimeoutFailureReason,
      startAgentTimeout,
      clearAgentTimeout,
      clearAgentTimeoutFailureReason,
      updateAgentTimeoutState,
      updateAgentTimeoutParticipantExists,
    ],
  );

  // The host `useAgent` derives its state from: a live room + connection state + the agent-timeout
  // controls. Expose it so the attached thread (and thus `useAgent(thread)`) can resolve this call.
  const agentHost: AgentHost = React.useMemo(
    () => ({ room, connectionState: roomConnectionState, internal: callInternal }),
    [room, roomConnectionState, callInternal],
  );

  React.useEffect(() => {
    registerCall(agentHost);
    return () => {
      registerCall(null);
    };
  }, [registerCall, agentHost]);

  const waitUntilConnectionState = useCallWaitUntilConnectionState(emitter, roomConnectionState);

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

  const setEncryptionEnabled = React.useCallback(
    async (enabled: boolean) => room.setE2EEEnabled(enabled),
    [room],
  );

  const agent = useAgent(agentHost);

  // // Mirror voice transcriptions (data channel) into the thread's shared store, so the thread's
  // // transcript holds both chat and call transcripts. This is the call's write side; `useThreadMessages`
  // // only reads the store.
  // const transcriptions: Array<TextStreamData> = useTranscriptions({ room });
  // const transcriptionMessages: Array<
  //   ReceivedUserTranscriptionMessage | ReceivedAgentTranscriptionMessage
  // > = React.useMemo(() => {
  //   return transcriptions.map((transcription) => {
  //     switch (transcription.participantInfo.identity) {
  //       case room.localParticipant.identity:
  //         return {
  //           type: 'userTranscript',
  //           message: transcription.text,

  //           id: transcription.streamInfo.id,
  //           timestamp: transcription.streamInfo.timestamp,
  //           attributes: transcription.streamInfo.attributes,
  //           from: room.localParticipant,
  //         };

  //       case agent.internal.agentParticipant?.identity:
  //       case agent.internal.workerParticipant?.identity:
  //         return {
  //           type: 'agentTranscript',
  //           message: transcription.text,

  //           id: transcription.streamInfo.id,
  //           timestamp: transcription.streamInfo.timestamp,
  //           attributes: transcription.streamInfo.attributes,
  //           from:
  //             agent.internal.agentParticipant?.identity === transcription.participantInfo.identity
  //               ? agent.internal.agentParticipant
  //               : agent.internal.workerParticipant!,
  //         };

  //       default:
  //         // FIXME: what should happen if an associated participant is not found?
  //         //
  //         // For now, just assume it is an agent transcription, since maybe it is from an agent
  //         // which disconencted from the room or something like that.
  //         return {
  //           type: 'agentTranscript',
  //           message: transcription.text,

  //           id: transcription.streamInfo.id,
  //           timestamp: transcription.streamInfo.timestamp,
  //           attributes: transcription.streamInfo.attributes,
  //           from: Array.from(room.remoteParticipants.values()).find(
  //             (p) => p.identity === transcription.participantInfo.identity,
  //           ),
  //         };
  //     }
  //   });
  // }, [transcriptions, room, agent.internal.agentParticipant, agent.internal.workerParticipant]);

  // // Loop-safe: deps are the memoized transcription array (stable until it changes), and the store
  // // upsert short-circuits when nothing changed.
  // React.useEffect(() => {
  //   messageStore.upsertMessages(transcriptionMessages);
  // }, [transcriptionMessages, messageStore.upsertMessages]);

  const wasCallEndCalledRef = React.useRef(false);

  const start = React.useCallback(
    async (connectOptions: CallConnectOptions = {}) => {
      const {
        signal,
        tracks = { microphone: { enabled: true, publishOptions: { preConnectBuffer: true } } },
        roomConnectOptions,
      } = connectOptions;

      await waitUntilDisconnected(signal);
      wasCallEndCalledRef.current = false;

      const onSignalAbort = () => {
        room.disconnect();
      };
      signal?.addEventListener('abort', onSignalAbort);

      const onDisconnected = () => {
        // on disconnection force a new token to be fetched in order to avoid reusing the same room right after
        // this works around the fact that agents won't rejoin a room that existed previously
        // and depends on the assumption that the endpoint will return a token for a different room
        if (!wasCallEndCalledRef.current) {
          tokenSourceFetch(true);
        }
      };
      room.once(RoomEvent.Disconnected, onDisconnected);

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
        tracks.camera?.enabled
          ? room.localParticipant.setCameraEnabled(
              true,
              undefined,
              tracks.camera?.publishOptions ?? {},
            )
          : Promise.resolve(),
        tracks.screenShare?.enabled
          ? room.localParticipant.setScreenShareEnabled(
              true,
              undefined,
              tracks.screenShare?.publishOptions ?? {},
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
    wasCallEndCalledRef.current = true;
    tokenSourceFetch(true);
    await room.disconnect();
  }, [room, tokenSourceFetch]);

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
    [/* note: no prepareConnection here, this effect should only ever run once! */],
  );

  // When the thread id changes on an active call, cycle the room so its agent is re-dispatched against
  // the new thread: disconnect and mint a fresh token (with the new thread id in the dispatch metadata)
  // in parallel, then reconnect. A disconnected call needs nothing — its next start() already uses the
  // new thread id.
  const previousThreadIdRef = React.useRef(threadId);
  React.useEffect(() => {
    if (previousThreadIdRef.current === threadId) {
      return;
    }
    previousThreadIdRef.current = threadId;

    if (room.state === ConnectionState.Disconnected) {
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const [credentials] = await Promise.all([tokenSourceFetch(true), room.disconnect()]);
        if (cancelled) {
          return;
        }
        await room.connect(credentials.serverUrl, credentials.participantToken);
      } catch (err) {
        // FIXME: figure out a better logging solution?
        console.warn('WARNING: useCall failed to reconnect after a thread id change:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [threadId, room, tokenSourceFetch]);

  const generateDerivedConnectionStateValues = React.useCallback(
    <State extends UseCallReturn['connectionState']>(connectionState: State) =>
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

  const callState = React.useMemo(():
    | CallStateConnecting
    | CallStateConnected
    | CallStateDisconnected => {
    const common: CallStateCommon = {
      room,
      internal: callInternal,
    };

    switch (roomConnectionState) {
      case ConnectionState.Connecting:
        return {
          ...common,

          connectionState: ConnectionState.Connecting,
          ...generateDerivedConnectionStateValues(ConnectionState.Connecting),

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

          connectionState: roomConnectionState,
          ...generateDerivedConnectionStateValues(roomConnectionState),

          local: {
            cameraTrack: localCamera,
            microphoneTrack: localMicrophone,
            screenShareTrack: localScreenShare,
          },
        };

      case ConnectionState.Disconnected:
        return {
          ...common,

          connectionState: ConnectionState.Disconnected,
          ...generateDerivedConnectionStateValues(ConnectionState.Disconnected),

          local: {
            cameraTrack: undefined,
            microphoneTrack: undefined,
            screenShareTrack: undefined,
          },
        };
    }
  }, [
    callInternal,
    room,
    roomConnectionState,
    localCamera,
    localMicrophone,
    localScreenShare,
    generateDerivedConnectionStateValues,
  ]);

  return React.useMemo(
    () => ({
      ...callState,

      waitUntilConnected,
      waitUntilDisconnected,

      prepareConnection,
      start,
      end,

      setEncryptionEnabled,
    }),
    [
      callState,
      waitUntilConnected,
      waitUntilDisconnected,
      prepareConnection,
      start,
      end,
      setEncryptionEnabled,
    ],
  );
}

/** Internal hook used by useCall to create a function which can be used to wait until the call is in a
 * given connection state before resolving. */
function useCallWaitUntilConnectionState(
  emitter: TypedEventEmitter<CallCallbacks>,
  connectionState: UseCallReturn['connectionState'],
) {
  const connectionStateRef = React.useRef(connectionState);
  React.useEffect(() => {
    connectionStateRef.current = connectionState;
  }, [connectionState]);

  return React.useCallback(
    async (state: UseCallReturn['connectionState'], signal?: AbortSignal) => {
      if (connectionStateRef.current === state) {
        return;
      }

      return new Promise<void>((resolve, reject) => {
        const onceEventOccurred = (newState: UseCallReturn['connectionState']) => {
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
              `useCall(/* ... */).waitUntilConnectionState(${state}, /* signal */) - signal aborted`,
            ),
          );
        };

        const cleanup = () => {
          emitter.off(CallEvent.ConnectionStateChanged, onceEventOccurred);
          signal?.removeEventListener('abort', abortHandler);
        };

        emitter.on(CallEvent.ConnectionStateChanged, onceEventOccurred);
        signal?.addEventListener('abort', abortHandler);
      });
    },
    [emitter],
  );
}
