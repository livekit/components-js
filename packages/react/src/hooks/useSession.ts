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
  BaseKeyProvider,
  RoomOptions,
  ExternalE2EEKeyProvider,
  type BaseE2EEManager,
} from 'livekit-client';
import { EventEmitter } from 'events';

import { useMaybeRoomContext } from '../context';
import { AgentState, useAgent, useAgentTimeoutIdStore } from './useAgent';
import { TrackReference, log } from '@livekit/components-core';
import { useLocalParticipant } from './useLocalParticipant';
import { TextTransport } from '../text-transport/TextTransport';

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

/** @beta */
export type SessionMode = 'rtc' | 'text';

/** The `internal` bag shared by both modes. Kept uniform across modes so that session-dependent
 * hooks (notably `useAgent`) work unchanged regardless of mode. */
type SessionStateInternal = {
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

/** The mode-specific "handle" a session exposes: an RTC `Room`, or a text-mode `TextTransport`. */
type SessionModeState<Mode extends SessionMode> = Mode extends 'text'
  ? { mode: 'text'; textTransport: TextTransport }
  : { mode: 'rtc'; room: Room };

type SessionStateCommon<Mode extends SessionMode> = SessionModeState<Mode> & {
  internal: SessionStateInternal;
};

type SessionStateConnecting<Mode extends SessionMode = 'rtc'> = SessionStateCommon<Mode> & {
  connectionState: ConnectionState.Connecting;
  isConnected: false;

  local: {
    cameraTrack: undefined;
    microphoneTrack: undefined;
    screenShareTrack: undefined;
  };
};

type SessionStateConnected<Mode extends SessionMode = 'rtc'> = SessionStateCommon<Mode> & {
  connectionState:
    ConnectionState.Connected | ConnectionState.Reconnecting | ConnectionState.SignalReconnecting;
  isConnected: true;

  local: {
    cameraTrack?: TrackReference;
    microphoneTrack?: TrackReference;
    screenShareTrack?: TrackReference;
  };
};

type SessionStateDisconnected<Mode extends SessionMode = 'rtc'> = SessionStateCommon<Mode> & {
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
export type UseSessionReturn<Mode extends SessionMode = 'rtc'> = (
  SessionStateConnecting<Mode> | SessionStateConnected<Mode> | SessionStateDisconnected<Mode>
) &
  SessionActions;

/** @internal */
export function isUseSessionReturn<Mode extends SessionMode = 'rtc'>(value: unknown, mode?: Mode): value is UseSessionReturn<Mode> {
  const isSessionReturn = (
    typeof value === 'object' &&
    value !== null &&
    'connectionState' in value &&
    'internal' in value
  );

  switch (mode) {
    case 'text':
      return isSessionReturn && 'textTransport' in value;
    case 'rtc':
    default:
      return isSessionReturn && 'room' in value;
  }
}

type UseSessionCommonOptions = {
  /**
   * Amount of time in milliseonds the system will wait for an agent to join the room, before
   * transitioning to the "failure" state.
   */
  agentConnectTimeoutMilliseconds?: number;
};

type UseSessionWithRoomOptions = {
  mode?: 'rtc';
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
  mode?: 'rtc';

  // NOTE: This must be here to make typescript go down this discriminated union branch when
  // "room" is omitted.
  room?: never;

  /** Configuration for room-level E2EE */
  encryption?: UseSessionEncryptionOptions;
};

type UseSessionRoomOptions = UseSessionWithRoomOptions | UseSessionWithoutRoomOptions;

/** Options that select "text mode" — a subset of the session api served entirely over HTTP (A2A). */
type UseSessionTextOptions = {
  mode: 'text';

  /**
   * Fully-qualified base URL of the A2A `v1` interface, e.g.
   * `http://localhost:8787/fare-desk/v1`.
   */
  baseUrl: string;

  room?: never;
  encryption?: never;
};

type UseSessionConfigurableRtcOptions = UseSessionCommonOptions &
  UseSessionRoomOptions &
  TokenSourceFetchOptions;
type UseSessionFixedRtcOptions = UseSessionCommonOptions & UseSessionRoomOptions;

type UseSessionConfigurableTextOptions = UseSessionCommonOptions &
  UseSessionTextOptions &
  TokenSourceFetchOptions;
type UseSessionFixedTextOptions = UseSessionCommonOptions & UseSessionTextOptions;

type UseSessionConfigurableOptions =
  | UseSessionConfigurableRtcOptions
  | UseSessionConfigurableTextOptions;
type UseSessionFixedOptions = UseSessionFixedRtcOptions | UseSessionFixedTextOptions;

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

  const tokenSourceFetch = React.useCallback(
    async (force?: boolean) => {
      if (isConfigurable) {
        if (!memoizedTokenFetchOptionsRef.current) {
          throw new Error(
            `AgentSession - memoized token fetch options are not set, but the passed tokenSource was an instance of TokenSourceConfigurable. If you are seeing this please make a new GitHub issue!`,
          );
        }
        return tokenSource.fetch(memoizedTokenFetchOptionsRef.current, force);
      } else {
        return tokenSource.fetch();
      }
    },
    [isConfigurable, tokenSource],
  );

  return tokenSourceFetch;
}

/**
 * A Session represents a managed connection to a Room which can contain Agents.
 * @beta
 */
export function useSession(
  tokenSource: TokenSourceConfigurable,
  options: UseSessionConfigurableTextOptions,
): UseSessionReturn<'text'>;
/**
 * A Session represents a managed connection to a Room which can contain Agents.
 * @beta
 */
export function useSession(
  tokenSource: TokenSourceFixed,
  options: UseSessionFixedTextOptions,
): UseSessionReturn<'text'>;
/**
 * A Session represents a managed connection to a Room which can contain Agents.
 * @beta
 */
export function useSession(
  tokenSource: TokenSourceConfigurable,
  options?: UseSessionConfigurableRtcOptions,
): UseSessionReturn<'rtc'>;
/**
 * A Session represents a managed connection to a Room which can contain Agents.
 * @beta
 */
export function useSession(
  tokenSource: TokenSourceFixed,
  options?: UseSessionFixedRtcOptions,
): UseSessionReturn<'rtc'>;
export function useSession(
  tokenSource: TokenSourceConfigurable | TokenSourceFixed,
  options: UseSessionConfigurableOptions | UseSessionFixedOptions = {},
): UseSessionReturn<'rtc'> | UseSessionReturn<'text'> {
  const isText = options.mode === 'text';

  // NOTE: Both hooks are ALWAYS called (Rules of Hooks). Each is gated by `enabled` so that the
  // inactive one performs no side effects (no network, no room connection). We cannot use a
  // `switch` here because `mode` can in principle change across renders.
  const rtcResult = useSessionRtc(
    tokenSource,
    (isText ? {} : options) as UseSessionConfigurableRtcOptions | UseSessionFixedRtcOptions,
    !isText,
  );
  const textResult = useSessionText(
    tokenSource,
    (isText ? options : { mode: 'text', baseUrl: '' }) as
      | UseSessionConfigurableTextOptions
      | UseSessionFixedTextOptions,
    isText,
  );

  return isText ? textResult : rtcResult;
}

/**
 * The RTC implementation of useSession. This is the original useSession behavior. When `enabled` is
 * false (because the session is in text mode) its network-effecting side effects are skipped.
 * @internal
 */
export function useSessionRtc(
  tokenSource: TokenSourceConfigurable | TokenSourceFixed,
  options: UseSessionConfigurableRtcOptions | UseSessionFixedRtcOptions,
  enabled: boolean,
): UseSessionReturn<'rtc'> {
  const {
    mode: _mode,
    room: optionsRoom,
    agentConnectTimeoutMilliseconds,
    encryption: unstableEncryption,
    ...unstableRestOptions
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
        'useSession options encryption was set, but neither encryption.key with encryption.worker nor encryption.e2eeManager was provided.',
      );
    }
    const room = new Room(roomOptions);
    if (encryptionEnabled) {
      room.setE2EEEnabled(true);
    }
    return room;
  }, [roomFromContext, optionsRoom, keyProvider, encryptionWorker, encryptionE2eeManager]);

  React.useEffect(() => {
    if (!enabled) {
      return;
    }
    return () => {
      room.disconnect();
    };
  }, [room, enabled]);

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

  const sessionInternal: SessionStateInternal = React.useMemo(
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
    | SessionStateConnecting<'rtc'>
    | SessionStateConnected<'rtc'>
    | SessionStateDisconnected<'rtc'> => {
    const common: SessionStateCommon<'rtc'> = {
      mode: 'rtc',
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
    sessionInternal,
    room,
    roomConnectionState,
    localCamera,
    localMicrophone,
    localScreenShare,
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

  const setEncryptionEnabled = React.useCallback(
    async (enabled: boolean) => room.setE2EEEnabled(enabled),
    [room],
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

  const tokenSourceFetch = useSessionTokenSourceFetch(tokenSource, unstableRestOptions);

  const wasSessionEndCalledRef = React.useRef(false);

  const start = React.useCallback(
    async (connectOptions: SessionConnectOptions = {}) => {
      const {
        signal,
        tracks = { microphone: { enabled: true, publishOptions: { preConnectBuffer: true } } },
        roomConnectOptions,
      } = connectOptions;

      await waitUntilDisconnected(signal);
      wasSessionEndCalledRef.current = false;

      const onSignalAbort = () => {
        room.disconnect();
      };
      signal?.addEventListener('abort', onSignalAbort);

      const onDisconnected = () => {
        // on disconnection force a new token to be fetched in order to avoid reusing the same room right after
        // this works around the fact that agents won't rejoin a room that existed previously
        // and depends on the assumption that the endpoint will return a token for a different room
        if (!wasSessionEndCalledRef.current) {
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
    wasSessionEndCalledRef.current = true;
    tokenSourceFetch(true);
    await room.disconnect();
  }, [room, tokenSourceFetch]);

  const prepareConnection = React.useCallback(async () => {
    const credentials = await tokenSourceFetch();
    await room.prepareConnection(credentials.serverUrl, credentials.participantToken);
  }, [tokenSourceFetch, room]);
  React.useEffect(
    () => {
      if (!enabled) {
        return;
      }
      prepareConnection().catch((err) => {
        // FIXME: figure out a better logging solution?
        console.warn('WARNING: Room.prepareConnection failed:', err);
      });
    },
    [/* note: no prepareConnection here, this effect should only ever run once! */ enabled],
  );

  return React.useMemo(
    () => ({
      ...conversationState,

      waitUntilConnected,
      waitUntilDisconnected,

      prepareConnection,
      start,
      end,

      setEncryptionEnabled,
    }),
    [
      conversationState,
      waitUntilConnected,
      waitUntilDisconnected,
      prepareConnection,
      start,
      end,
      setEncryptionEnabled,
    ],
  );
}

/**
 * The text-mode implementation of useSession. A subset of the session api served over HTTP (A2A).
 * When `enabled` is false (because the session is in RTC mode) it performs no side effects.
 * @internal
 */
export function useSessionText(
  tokenSource: TokenSourceConfigurable | TokenSourceFixed,
  options: UseSessionConfigurableTextOptions | UseSessionFixedTextOptions,
  enabled: boolean,
): UseSessionReturn<'text'> {
  const { mode: _mode, baseUrl, agentConnectTimeoutMilliseconds, ...unstableRestOptions } = options;

  const emitter = React.useMemo(
    () => new EventEmitter() as TypedEventEmitter<SessionCallbacks>,
    [],
  );

  const tokenSourceFetch = useSessionTokenSourceFetch(
    tokenSource,
    unstableRestOptions as Exclude<UseSessionConfigurableOptions, keyof UseSessionCommonOptions>,
  );

  // A stable conversation id for the lifetime of this session.
  const [contextId] = React.useState<string>(() => crypto.randomUUID());

  const textTransport = React.useMemo(
    () =>
      new TextTransport({
        baseUrl,
        contextId,
        getToken: async () => {
          const credentials = await tokenSourceFetch();
          return credentials.participantToken;
        },
      }),
    [baseUrl, contextId, tokenSourceFetch],
  );

  const [connectionState, setConnectionState] = React.useState<ConnectionState>(
    ConnectionState.Disconnected,
  );
  React.useEffect(() => {
    emitter.emit(SessionEvent.ConnectionStateChanged, connectionState);
  }, [emitter, connectionState]);

  const waitUntilConnectionState = useSessionWaitUntilConnectionState(emitter, connectionState);
  const waitUntilConnected = React.useCallback(
    async (signal?: AbortSignal) => waitUntilConnectionState(ConnectionState.Connected, signal),
    [waitUntilConnectionState],
  );
  const waitUntilDisconnected = React.useCallback(
    async (signal?: AbortSignal) => waitUntilConnectionState(ConnectionState.Disconnected, signal),
    [waitUntilConnectionState],
  );

  // "Connecting" in text mode == fetching the initial token. There is no persistent socket.
  const start = React.useCallback(async () => {
    if (!enabled) {
      return;
    }
    setConnectionState(ConnectionState.Connecting);
    try {
      await textTransport.connect();
      setConnectionState(ConnectionState.Connected);
    } catch (err) {
      setConnectionState(ConnectionState.Disconnected);
      throw err;
    }
  }, [enabled, textTransport]);

  const end = React.useCallback(async () => {
    await textTransport.disconnect();
    setConnectionState(ConnectionState.Disconnected);
  }, [textTransport]);

  // FIXME(text-mode): no equivalent of Room.prepareConnection / E2EE in text mode yet. These are
  // no-ops for now and need to be figured out properly before release.
  const prepareConnection = React.useCallback(async () => {}, []);
  const setEncryptionEnabled = React.useCallback(async () => {}, []);

  // NOTE: kept so that `internal` stays uniform across modes (useAgent reads these). None of this
  // machinery actually runs in text mode.
  const {
    agentTimeoutFailureReason,
    startAgentTimeout,
    clearAgentTimeout,
    clearAgentTimeoutFailureReason,
    updateAgentTimeoutState,
    updateAgentTimeoutParticipantExists,
  } = useAgentTimeoutIdStore();

  const sessionInternal: SessionStateInternal = React.useMemo(
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
      tokenSource,
      agentConnectTimeoutMilliseconds,
      agentTimeoutFailureReason,
      startAgentTimeout,
      clearAgentTimeout,
      clearAgentTimeoutFailureReason,
      updateAgentTimeoutState,
      updateAgentTimeoutParticipantExists,
    ],
  );

  const conversationState = React.useMemo(():
    | SessionStateConnecting<'text'>
    | SessionStateConnected<'text'>
    | SessionStateDisconnected<'text'> => {
    const common: SessionStateCommon<'text'> = {
      mode: 'text',
      textTransport,
      internal: sessionInternal,
    };

    const local = {
      cameraTrack: undefined,
      microphoneTrack: undefined,
      screenShareTrack: undefined,
    } as const;

    switch (connectionState) {
      case ConnectionState.Connecting:
        return { ...common, connectionState: ConnectionState.Connecting, isConnected: false, local };
      case ConnectionState.Connected:
      case ConnectionState.Reconnecting:
      case ConnectionState.SignalReconnecting:
        return { ...common, connectionState, isConnected: true, local };
      case ConnectionState.Disconnected:
      default:
        return {
          ...common,
          connectionState: ConnectionState.Disconnected,
          isConnected: false,
          local,
        };
    }
  }, [connectionState, textTransport, sessionInternal]);

  return React.useMemo(
    () => ({
      ...conversationState,

      waitUntilConnected,
      waitUntilDisconnected,

      prepareConnection,
      start,
      end,

      setEncryptionEnabled,
    }),
    [
      conversationState,
      waitUntilConnected,
      waitUntilDisconnected,
      prepareConnection,
      start,
      end,
      setEncryptionEnabled,
    ],
  );
}
