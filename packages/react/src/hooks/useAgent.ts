import { ParticipantAgentAttributes, TrackReference } from '@livekit/components-core';
import { EventEmitter } from 'events';
import {
  ConnectionState,
  LocalTrackPublication,
  Participant,
  ParticipantEvent,
  ParticipantKind,
  RemoteParticipant,
  RoomEvent,
  Track,
} from 'livekit-client';
import * as React from 'react';
import type TypedEventEmitter from 'typed-emitter';

import { useMaybeSessionContext, useMaybeThreadContext } from '../context';
import { useParticipantInfo } from './useParticipantInfo';
import { useParticipantTracks } from './useParticipantTracks';
import { useRemoteParticipants } from './useRemoteParticipants';
import { isUseThreadReturn, type ActiveCall, type UseThreadReturn } from './useThread';
import { isUseSessionReturn, UseSessionReturn } from './useSession';

// FIXME: make this 10 seconds once room dispatch booting info is discoverable
const DEFAULT_AGENT_CONNECT_TIMEOUT_MILLISECONDS = 20_000;

/** @see https://github.com/livekit/agents/blob/65170238db197f62f479eb7aaef1c0e18bfad6e7/livekit-agents/livekit/agents/voice/events.py#L97 */
type AgentSdkStates = 'initializing' | 'idle' | 'listening' | 'thinking' | 'speaking';

/**
 * State representing the current status of the agent, whether it is ready for speach, etc
 *
 * For most agents (which have the preconnect audio buffer feature enabled), this is the lifecycle:
 *   connecting ➡️ pre-connect-buffering ➡️ initializing/listening/thinking/speaking
 *
 * For agents without the preconnect audio feature enabled:
 *   connecting ➡️ initializing ➡️ idle/listening/thinking/speaking
 *
 * If an agent fails to connect:
 *   connecting ➡️ pre-connect-buffering/initializing ➡️ failed
 *
 * For a call-less (text-only) thread, there is no room to connect, so agent state reflects the text
 * response lifecycle instead:
 *   idle ➡️ thinking ➡️ typing ➡️ idle
 *
 * Legacy useVoiceAssistant hook:
 *   disconnected ➡️ connecting ➡️ initializing ➡️ listening/thinking/speaking
 *
 * @beta
 * */
export type AgentState =
  // `disconnected` is retained for back-compat (e.g. the legacy useVoiceAssistant), but the current
  // useAgent never emits it — its at-rest state is `idle`. `typing` is the text-mode equivalent of
  // `speaking`.
  'disconnected' | 'connecting' | 'pre-connect-buffering' | 'failed' | 'typing' | AgentSdkStates;

/** @beta */
export enum AgentEvent {
  CameraChanged = 'cameraChanged',
  MicrophoneChanged = 'microphoneChanged',
  StateChanged = 'stateChanged',
}

/** @beta */
export type AgentCallbacks = {
  [AgentEvent.CameraChanged]: (newTrack: TrackReference | undefined) => void;
  [AgentEvent.MicrophoneChanged]: (newTrack: TrackReference | undefined) => void;
  [AgentEvent.StateChanged]: (newAgentState: AgentState) => void;
};

type AgentStateCommon = {
  // FIXME: maybe add some sort of schema to this?
  attributes: Participant['attributes'];

  internal: {
    emitter: TypedEventEmitter<AgentCallbacks>;

    agentParticipant: RemoteParticipant | null;
    workerParticipant: RemoteParticipant | null;
  };
};

type AgentStateAvailable = AgentStateCommon & {
  state: 'listening' | 'thinking' | 'speaking';
  failureReasons: null;

  /** The agent's assigned identity, coming from the JWT token. */
  identity: Participant['identity'];
  name: Participant['name'];
  metadata: Participant['metadata'];

  /** Is the agent connected to the client? */
  isConnected: true;

  /**
   * Could the client be listening for user speech?
   *
   * Note that this may not mean that the agent is actually connected - the audio pre-connect
   * buffer could be active and recording user input before the agent actually connects.
   * */
  canListen: true;

  /** Has the client disconnected from the agent either for an expected or unexpected reason? */
  isFinished: false;

  /** Is the agent currently connecting or setting itself up? */
  isPending: false;

  cameraTrack?: TrackReference;
  microphoneTrack?: TrackReference;
};

type AgentStatePreConnectBuffering = AgentStateCommon & {
  state: 'pre-connect-buffering';
  failureReasons: null;

  /** The client's assigned identity, coming from the JWT token. */
  identity: Participant['identity'];
  name: Participant['name'];
  metadata: Participant['metadata'];

  /** Is the agent connected to the client? */
  isConnected: false;

  /**
   * Could the client be listening for user speech?
   *
   * Note that this may not mean that the agent is actually connected - the audio pre-connect
   * buffer could be active and recording user input before the agent actually connects.
   * */
  canListen: true;

  /** Has the client disconnected from the agent either for an expected or unexpected reason? */
  isFinished: false;

  /** Is the agent currently connecting or setting itself up? */
  isPending: false;

  cameraTrack?: TrackReference;
  microphoneTrack?: TrackReference;
};

type AgentStateUnAvailable = AgentStateCommon & {
  state: 'initializing' | 'idle';
  failureReasons: null;

  /** The client's assigned identity, coming from the JWT token. */
  identity: Participant['identity'];
  name: Participant['name'];
  metadata: Participant['metadata'];

  /** Is the agent connected to the client? */
  isConnected: false;

  /**
   * Could the client be listening for user speech?
   *
   * Note that this may not mean that the agent is actually connected - the audio pre-connect
   * buffer could be active and recording user input before the agent actually connects.
   * */
  canListen: false;

  /** Has the client disconnected from the agent either for an expected or unexpected reason? */
  isFinished: false;

  /** Is the agent currently connecting or setting itself up? */
  isPending: true;

  cameraTrack?: TrackReference;
  microphoneTrack?: TrackReference;
};

type AgentStateConnecting = AgentStateCommon & {
  state: 'connecting';
  failureReasons: null;

  /** The client's assigned identity, coming from the JWT token. */
  identity: undefined;
  name: undefined;
  metadata: undefined;

  /** Is the agent connected to the client? */
  isConnected: false;

  /**
   * Could the client be listening for user speech?
   *
   * Note that this may not mean that the agent is actually connected - the audio pre-connect
   * buffer could be active and recording user input before the agent actually connects.
   * */
  canListen: false;

  /** Has the client disconnected from the agent either for an expected or unexpected reason? */
  isFinished: false;

  /** Is the agent currently connecting or setting itself up? */
  isPending: true;

  cameraTrack: undefined;
  microphoneTrack: undefined;
};

type AgentStateDisconnected = AgentStateCommon & {
  state: 'disconnected';
  failureReasons: null;

  /** The client's assigned identity, coming from the JWT token. */
  identity: undefined;
  name: undefined;
  metadata: undefined;

  /** Is the agent connected to the client? */
  isConnected: false;

  /**
   * Could the client be listening for user speech?
   *
   * Note that this may not mean that the agent is actually connected - the audio pre-connect
   * buffer could be active and recording user input before the agent actually connects.
   * */
  canListen: false;

  /** Has the client disconnected from the agent either for an expected or unexpected reason? */
  isFinished: true;

  /** Is the agent currently connecting or setting itself up? */
  isPending: false;

  cameraTrack: undefined;
  microphoneTrack: undefined;
};

type AgentStateFailed = AgentStateCommon & {
  state: 'failed';
  failureReasons: Array<string>;

  /** The client's assigned identity, coming from the JWT token. */
  identity: undefined;
  name: undefined;
  metadata: undefined;

  /** Is the agent connected to the client? */
  isConnected: false;

  /**
   * Could the client be listening for user speech?
   *
   * Note that this may not mean that the agent is actually connected - the audio pre-connect
   * buffer could be active and recording user input before the agent actually connects.
   * */
  canListen: false;

  /** Has the client disconnected from the agent either for an expected or unexpected reason? */
  isFinished: true;

  /** Is the agent currently connecting or setting itself up? */
  isPending: false;

  cameraTrack: undefined;
  microphoneTrack: undefined;
};

/**
 * The agent state for a call-less (text-only) thread. There is no live room, so there is no agent
 * participant, no identity and no tracks, and none of the connection-oriented flags are set. The
 * `state` reflects the text response lifecycle driven by `useThreadMessages().send()`.
 *
 * NOTE: `thinking` is included here (not only `idle`/`typing`) because the text lifecycle is
 * idle → thinking → typing → idle; a call-less `thinking` has no room, unlike the voice `thinking` in
 * {@link AgentStateAvailable}.
 */
type AgentStateTextMode = AgentStateCommon & {
  state: 'idle' | 'thinking' | 'typing';
  failureReasons: null;

  identity: undefined;
  name: undefined;
  metadata: undefined;

  isConnected: false;
  canListen: false;
  isFinished: false;
  isPending: false;

  cameraTrack: undefined;
  microphoneTrack: undefined;
};

type AgentActions = {
  /** Returns a promise that resolves once the agent is connected and available for user input */
  waitUntilConnected: (signal?: AbortSignal) => Promise<void>;

  /**
   * Returns a promise that resolves once the client could be listening for user speech (`canListen` is true)
   *
   * Note that this may not mean that the agent is actually connected - the audio pre-connect
   * buffer could be active and recording user input before the agent actually connects.
   * */
  waitUntilCouldBeListening: (signal?: AbortSignal) => Promise<void>;

  /** Returns a promise that resolves once the client has disconnected from the agent either for an expected or unexpected reason. */
  waitUntilFinished: (signal?: AbortSignal) => Promise<void>;

  /** Returns a promise that resolves once the agent has published a camera track */
  waitUntilCamera: (signal?: AbortSignal) => Promise<TrackReference>;

  /** Returns a promise that resolves once the agent has published a microphone track */
  waitUntilMicrophone: (signal?: AbortSignal) => Promise<TrackReference>;
};

type AgentStateCases =
  | AgentStateConnecting
  | AgentStateDisconnected
  | AgentStateAvailable
  | AgentStatePreConnectBuffering
  | AgentStateUnAvailable
  | AgentStateFailed
  | AgentStateTextMode;

/** @beta */
export type UseAgentReturn = AgentStateCases & AgentActions;

type SessionStub = Pick<UseSessionReturn, 'connectionState' | 'room' | 'internal'>;

const generateDerivedStateValues = <State extends AgentState>(state: State) =>
  ({
    isConnected: state === 'listening' || state === 'thinking' || state === 'speaking',
    canListen:
      state === 'pre-connect-buffering' ||
      state === 'listening' ||
      state === 'thinking' ||
      state === 'speaking',
    isFinished: state === 'disconnected' || state === 'failed',
    isPending: state === 'connecting' || state === 'initializing' || state === 'idle',
  }) as {
    isConnected: State extends 'listening' | 'thinking' | 'speaking' ? true : false;
    canListen: State extends 'pre-connect-buffering' | 'listening' | 'thinking' | 'speaking'
      ? true
      : false;
    isFinished: State extends 'disconnected' | 'failed' ? true : false;
    isPending: State extends 'connecting' | 'initializing' | 'idle' ? true : false;
  };

/** Internal hook used by useSession to store global agent state */
export const useAgentTimeoutIdStore = (): {
  agentTimeoutFailureReason: string | null;
  startAgentTimeout: (agentConnectTimeoutMilliseconds?: number) => void;
  clearAgentTimeout: () => void;
  clearAgentTimeoutFailureReason: () => void;
  updateAgentTimeoutState: (agentState: AgentState) => void;
  updateAgentTimeoutParticipantExists: (agentParticipantExists: boolean) => void;
} => {
  const [agentTimeoutFailureReason, setAgentTimeoutFailureReason] = React.useState<string | null>(
    null,
  );
  const [agentTimeoutId, setAgentTimeoutId] = React.useState<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const agentStateRef = React.useRef<AgentState>('connecting');
  const agentParticipantExistsRef = React.useRef(false);

  const startAgentConnectedTimeout = (agentConnectTimeoutMilliseconds?: number) => {
    return setTimeout(() => {
      if (!agentParticipantExistsRef.current) {
        setAgentTimeoutFailureReason('Agent did not join the room.');
        return;
      }

      const { isConnected } = generateDerivedStateValues(agentStateRef.current);
      if (!isConnected) {
        setAgentTimeoutFailureReason('Agent joined the room but did not complete initializing.');
        return;
      }
    }, agentConnectTimeoutMilliseconds ?? DEFAULT_AGENT_CONNECT_TIMEOUT_MILLISECONDS);
  };

  return {
    agentTimeoutFailureReason,
    startAgentTimeout: React.useCallback(
      (agentConnectTimeoutMilliseconds?: number) => {
        if (agentTimeoutId) {
          clearTimeout(agentTimeoutId);
        }

        setAgentTimeoutFailureReason(null);
        setAgentTimeoutId(startAgentConnectedTimeout(agentConnectTimeoutMilliseconds));
        agentStateRef.current = 'connecting';
        agentParticipantExistsRef.current = false;
      },
      [agentTimeoutId],
    ),
    clearAgentTimeout: React.useCallback(() => {
      if (agentTimeoutId) {
        clearTimeout(agentTimeoutId);
      }

      setAgentTimeoutFailureReason(null);
      setAgentTimeoutId(null);
      agentStateRef.current = 'connecting';
      agentParticipantExistsRef.current = false;
    }, [agentTimeoutId]),
    clearAgentTimeoutFailureReason: React.useCallback(() => {
      setAgentTimeoutFailureReason(null);
    }, []),

    updateAgentTimeoutState: React.useCallback((agentState: AgentState) => {
      agentStateRef.current = agentState;
    }, []),
    updateAgentTimeoutParticipantExists: React.useCallback((agentParticipantExists: boolean) => {
      agentParticipantExistsRef.current = agentParticipantExists;
    }, []),
  };
};

/** Internal hook used by useAgent which generates a function that when called, will return a
 * promise which resolves when agent.isAvailable is enabled. */
function useAgentWaitUntilDerivedStates(
  emitter: TypedEventEmitter<AgentCallbacks>,
  state: AgentState,
) {
  const stateRef = React.useRef(state);
  React.useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const waitUntilConnected = React.useCallback(
    async (signal?: AbortSignal) => {
      const { isConnected } = generateDerivedStateValues(stateRef.current);
      if (isConnected) {
        return;
      }

      return new Promise<void>((resolve, reject) => {
        const stateChangedHandler = (state: AgentState) => {
          const { isConnected } = generateDerivedStateValues(state);
          if (!isConnected) {
            return;
          }
          cleanup();
          resolve();
        };
        const abortHandler = () => {
          cleanup();
          reject(new Error('useAgent(/* ... */).waitUntilConnected - signal aborted'));
        };

        const cleanup = () => {
          emitter.off(AgentEvent.StateChanged, stateChangedHandler);
          signal?.removeEventListener('abort', abortHandler);
        };

        emitter.on(AgentEvent.StateChanged, stateChangedHandler);
        signal?.addEventListener('abort', abortHandler);
      });
    },
    [emitter],
  );

  const waitUntilCouldBeListening = React.useCallback(
    async (signal?: AbortSignal) => {
      const { canListen } = generateDerivedStateValues(stateRef.current);
      if (canListen) {
        return;
      }

      return new Promise<void>((resolve, reject) => {
        const stateChangedHandler = (state: AgentState) => {
          const { canListen } = generateDerivedStateValues(state);
          if (!canListen) {
            return;
          }
          cleanup();
          resolve();
        };
        const abortHandler = () => {
          cleanup();
          reject(new Error('useAgent(/* ... */).waitUntilCouldBeListening - signal aborted'));
        };

        const cleanup = () => {
          emitter.off(AgentEvent.StateChanged, stateChangedHandler);
          signal?.removeEventListener('abort', abortHandler);
        };

        emitter.on(AgentEvent.StateChanged, stateChangedHandler);
        signal?.addEventListener('abort', abortHandler);
      });
    },
    [emitter],
  );

  const waitUntilFinished = React.useCallback(
    async (signal?: AbortSignal) => {
      const { isFinished } = generateDerivedStateValues(stateRef.current);
      if (isFinished) {
        return;
      }

      return new Promise<void>((resolve, reject) => {
        const stateChangedHandler = (state: AgentState) => {
          const { isFinished } = generateDerivedStateValues(state);
          if (!isFinished) {
            return;
          }
          cleanup();
          resolve();
        };
        const abortHandler = () => {
          cleanup();
          reject(new Error('useAgent(/* ... */).waitUntilFinished - signal aborted'));
        };

        const cleanup = () => {
          emitter.off(AgentEvent.StateChanged, stateChangedHandler);
          signal?.removeEventListener('abort', abortHandler);
        };

        emitter.on(AgentEvent.StateChanged, stateChangedHandler);
        signal?.addEventListener('abort', abortHandler);
      });
    },
    [emitter],
  );

  return { waitUntilConnected, waitUntilCouldBeListening, waitUntilFinished };
}

/** Takes a legacy {@link UseSessionReturn} and converts it into an internal {@link ActiveCall} (the
 * room is not part of it — it is resolved from the session's composed thread's `internal.room`). */
function convertSessionToActiveCall(session: SessionStub): ActiveCall {
  return {
    connectionState: session.connectionState,
    internal: {
      agentConnectTimeoutMilliseconds: session.internal.agentConnectTimeoutMilliseconds,

      agentTimeoutFailureReason: session.internal.agentTimeoutFailureReason,
      startAgentTimeout: session.internal.startAgentTimeout,
      clearAgentTimeout: session.internal.clearAgentTimeout,
      clearAgentTimeoutFailureReason: session.internal.clearAgentTimeoutFailureReason,
      updateAgentTimeoutState: session.internal.updateAgentTimeoutState,
      updateAgentTimeoutParticipantExists: session.internal.updateAgentTimeoutParticipantExists,
    },
  };
}

/**
 * useAgent encapculates all agent state, normalizing some quirks around how LiveKit Agents work.
 * @beta
 */
export function useAgent(threadOrSession?: UseThreadReturn | SessionStub): UseAgentReturn {
  const sessionFromContext = useMaybeSessionContext();
  const threadFromContext = useMaybeThreadContext();

  // Resolve the thread (always required) and its attached call (optional — a text-only thread has
  // none):
  //  - an explicit thread is used directly, its active call (if any) from `internal.activeCall`;
  //  - an explicit legacy session resolves to its composed thread + a converted active call;
  //  - otherwise fall back to the thread context, then the session context.
  let thread: UseThreadReturn | undefined;
  let activeCall: ActiveCall | undefined;
  if (threadOrSession && isUseThreadReturn(threadOrSession)) {
    thread = threadOrSession;
    activeCall = threadOrSession.internal.activeCall ?? undefined;
  } else if (threadOrSession && isUseSessionReturn(threadOrSession)) {
    thread = threadOrSession.internal.thread;
    activeCall = convertSessionToActiveCall(threadOrSession);
  } else if (threadFromContext) {
    thread = threadFromContext;
    activeCall = threadFromContext.internal.activeCall ?? undefined;
  } else if (sessionFromContext) {
    thread = sessionFromContext.internal.thread;
    activeCall = convertSessionToActiveCall(sessionFromContext);
  }
  if (!thread) {
    throw new Error(
      'No thread (or legacy session) provided, make sure you are inside a Thread context or pass the thread explicitly',
    );
  }

  // The single canonical room lives on the thread: an attached call registers its room there, and a
  // call-less thread exposes a disconnected placeholder. Every room-derived hook below runs against it
  // unconditionally (a never-connected placeholder simply yields no participants/tracks).
  const room = thread.internal.room;

  // The text-mode response lifecycle (idle → thinking → typing → idle), used when no call is connected.
  const textAgentState = thread.internal.textAgentState;

  // The agent-timeout controls only exist when a call is attached; a text-only thread has no
  // connection to time out, so they are absent and the timeout wiring below no-ops.
  const callInternal = activeCall?.internal;
  const agentConnectTimeoutMilliseconds = callInternal?.agentConnectTimeoutMilliseconds;
  const agentTimeoutFailureReason = callInternal?.agentTimeoutFailureReason ?? null;

  // `callInternal`'s identity churns: arming the timeout updates the store, whose new callbacks
  // round-trip back here through the thread's registered call. Reading it through a ref keeps the
  // timeout effects below off its identity, so they don't re-arm the timeout on every change (which
  // would be an infinite update loop).
  const callInternalRef = React.useRef(callInternal);
  React.useEffect(() => {
    callInternalRef.current = callInternal;
  });

  const emitter = React.useMemo(() => new EventEmitter() as TypedEventEmitter<AgentCallbacks>, []);

  const roomRemoteParticipants = useRemoteParticipants({ room });

  const agentParticipant = React.useMemo(() => {
    return (
      roomRemoteParticipants.find(
        (p) =>
          p.kind === ParticipantKind.AGENT &&
          !(ParticipantAgentAttributes.PublishOnBehalf in p.attributes),
      ) ?? null
    );
  }, [roomRemoteParticipants]);
  const workerParticipant = React.useMemo(() => {
    if (!agentParticipant) {
      return null;
    }
    return (
      roomRemoteParticipants.find(
        (p) =>
          p.kind === ParticipantKind.AGENT &&
          p.attributes[ParticipantAgentAttributes.PublishOnBehalf] === agentParticipant.identity,
      ) ?? null
    );
  }, [agentParticipant, roomRemoteParticipants]);

  // 1. Derive attributes directly from the participant object
  // Reactivity is already provided by useRemoteParticipants via RoomEvent.ParticipantAttributesChanged.
  const agentParticipantAttributes = agentParticipant?.attributes ?? {};

  // 2. Listen for track updates
  const agentTracks = useParticipantTracks([Track.Source.Camera, Track.Source.Microphone], {
    room,
    participantIdentity: agentParticipant?.identity,
  });
  const workerTracks = useParticipantTracks([Track.Source.Camera, Track.Source.Microphone], {
    room,
    participantIdentity: workerParticipant?.identity,
  });

  const videoTrack = React.useMemo(
    () =>
      agentTracks.find((t) => t.source === Track.Source.Camera) ??
      workerTracks.find((t) => t.source === Track.Source.Camera),
    [agentTracks, workerTracks],
  );
  React.useEffect(() => {
    emitter.emit(AgentEvent.CameraChanged, videoTrack);
  }, [emitter, videoTrack]);

  const audioTrack = React.useMemo(
    () =>
      agentTracks.find((t) => t.source === Track.Source.Microphone) ??
      workerTracks.find((t) => t.source === Track.Source.Microphone),
    [agentTracks, workerTracks],
  );
  React.useEffect(() => {
    emitter.emit(AgentEvent.MicrophoneChanged, audioTrack);
  }, [emitter, audioTrack]);

  // Listen for room connection state updates
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

  // When the agent participant connects, reset the timeout failure state
  React.useEffect(() => {
    if (!agentParticipant) {
      return;
    }

    callInternalRef.current?.clearAgentTimeoutFailureReason();
  }, [agentParticipant]);

  // If the agent participant disconnects in the middle of a conversation unexpectedly, mark that as an explicit failure
  const [agentDisconnectedFailureReason, setAgentDisconnectedFailureReason] = React.useState<
    string | null
  >(null);
  React.useEffect(() => {
    if (!agentParticipant) {
      return;
    }

    const onParticipantDisconnect = (participant: RemoteParticipant) => {
      if (participant.identity !== agentParticipant?.identity) {
        return;
      }
      setAgentDisconnectedFailureReason('Agent left the room unexpectedly.');
    };

    room.on(RoomEvent.ParticipantDisconnected, onParticipantDisconnect);

    return () => {
      room.off(RoomEvent.ParticipantDisconnected, onParticipantDisconnect);
    };
  }, [agentParticipant, room]);

  React.useEffect(() => {
    if (roomConnectionState !== ConnectionState.Disconnected) {
      return;
    }
    // Clear the agent disconnect failure state when the room disconnects
    setAgentDisconnectedFailureReason(null);
  }, [roomConnectionState]);

  const [localMicTrack, setLocalMicTrack] = React.useState<LocalTrackPublication | null>(
    () => room.localParticipant.getTrackPublication(Track.Source.Microphone) ?? null,
  );
  React.useEffect(() => {
    const handleLocalParticipantTrackPublished = () => {
      setLocalMicTrack(room.localParticipant.getTrackPublication(Track.Source.Microphone) ?? null);
    };
    const handleLocalParticipantTrackUnPublished = () => {
      setLocalMicTrack(null);
    };

    room.localParticipant.on(
      ParticipantEvent.LocalTrackPublished,
      handleLocalParticipantTrackPublished,
    );
    room.localParticipant.on(
      ParticipantEvent.LocalTrackUnpublished,
      handleLocalParticipantTrackUnPublished,
    );
    return () => {
      room.localParticipant.off(
        ParticipantEvent.LocalTrackPublished,
        handleLocalParticipantTrackPublished,
      );
      room.localParticipant.off(
        ParticipantEvent.LocalTrackUnpublished,
        handleLocalParticipantTrackUnPublished,
      );
    };
  }, [room.localParticipant]);

  const failureReasons = React.useMemo(() => {
    const reasons = [];
    if (agentTimeoutFailureReason) {
      reasons.push(agentTimeoutFailureReason);
    }
    if (agentDisconnectedFailureReason) {
      reasons.push(agentDisconnectedFailureReason);
    }
    return reasons;
  }, [agentTimeoutFailureReason, agentDisconnectedFailureReason]);

  // A call "connected" (driving voice state) means it is attached and not disconnected. Note a call
  // can be attached but disconnected (e.g. before `start()` or after `end()`); that is treated as text
  // mode, which is why this keys on the connection state, not mere attachment.
  const callConnected =
    typeof activeCall !== 'undefined' && activeCall.connectionState !== ConnectionState.Disconnected;

  const state = React.useMemo((): AgentState => {
    if (failureReasons.length > 0) {
      return 'failed';
    }

    // No connected call → reflect the thread's text response lifecycle (idle | thinking | typing).
    if (!callConnected) {
      return textAgentState;
    }

    // A call is connected → the voice lifecycle. The at-rest base is `idle` (never `disconnected`).
    let state: AgentState = 'idle';

    if (roomConnectionState !== ConnectionState.Disconnected) {
      state = 'connecting';
    }

    // If the microphone preconnect buffer is active, then a special 'pre-connect-buffering' state
    // is set
    if (localMicTrack) {
      state = 'pre-connect-buffering';
    }

    if (agentParticipant && agentParticipantAttributes[ParticipantAgentAttributes.AgentState]) {
      state = agentParticipantAttributes[ParticipantAgentAttributes.AgentState] as AgentSdkStates;
    }

    return state;
  }, [
    failureReasons,
    callConnected,
    textAgentState,
    roomConnectionState,
    localMicTrack,
    agentParticipant,
    agentParticipantAttributes,
  ]);

  React.useEffect(() => {
    emitter.emit(AgentEvent.StateChanged, state);
    callInternalRef.current?.updateAgentTimeoutState(state);
  }, [emitter, state]);
  React.useEffect(() => {
    callInternalRef.current?.updateAgentTimeoutParticipantExists(agentParticipant !== null);
  }, [agentParticipant]);

  // When the attached call's room begins connecting, start the agent timeout. Without a call there is
  // nothing to time out. Keyed on the connection state (via isHostDisconnected), NOT on callInternal's
  // identity — see the callInternalRef note above.
  const isHostDisconnected =
    !activeCall || activeCall.connectionState === ConnectionState.Disconnected;
  React.useEffect(() => {
    if (isHostDisconnected) {
      return;
    }
    const callInternalNow = callInternalRef.current;
    if (!callInternalNow) {
      return;
    }

    callInternalNow.startAgentTimeout(agentConnectTimeoutMilliseconds);
    return () => {
      callInternalNow.clearAgentTimeout();
    };
  }, [isHostDisconnected, agentConnectTimeoutMilliseconds]);

  const {
    identity: agentParticipantIdentity,
    name: agentParticipantName,
    metadata: agentParticipantMetadata,
  } = useParticipantInfo({ participant: agentParticipant ?? undefined });

  const agentState: AgentStateCases = React.useMemo(() => {
    const common: AgentStateCommon = {
      attributes: agentParticipantAttributes,

      internal: {
        agentParticipant,
        workerParticipant,
        emitter,
      },
    };

    if (state === 'failed') {
      return {
        ...common,
        identity: undefined,
        name: undefined,
        metadata: undefined,

        state: 'failed',
        ...generateDerivedStateValues('failed'),
        failureReasons,

        // Clear inner values if no longer connected
        cameraTrack: undefined,
        microphoneTrack: undefined,
      };
    }

    // No connected call → text mode. `state` is one of idle | thinking | typing; there is no agent
    // participant, no identity, no tracks, and none of the connection flags are set.
    if (!callConnected) {
      return {
        ...common,
        identity: undefined,
        name: undefined,
        metadata: undefined,

        state: state as AgentStateTextMode['state'],
        failureReasons: null,
        isConnected: false,
        canListen: false,
        isFinished: false,
        isPending: false,

        cameraTrack: undefined,
        microphoneTrack: undefined,
      };
    }

    // A call is connected → the voice lifecycle.
    switch (state) {
      case 'connecting':
        return {
          ...common,
          identity: undefined,
          name: undefined,
          metadata: undefined,

          state,
          ...generateDerivedStateValues(state),
          failureReasons: null,

          // Clear inner values if no longer connected
          cameraTrack: undefined,
          microphoneTrack: undefined,
        };

      case 'initializing':
      case 'idle':
        return {
          ...common,
          identity: agentParticipantIdentity!,
          name: agentParticipantName,
          metadata: agentParticipantMetadata,

          state,
          ...generateDerivedStateValues(state),
          failureReasons: null,

          cameraTrack: videoTrack,
          microphoneTrack: audioTrack,
        };

      case 'pre-connect-buffering':
        return {
          ...common,
          identity: agentParticipantIdentity!,
          name: agentParticipantName,
          metadata: agentParticipantMetadata,

          state,
          ...generateDerivedStateValues(state),
          failureReasons: null,

          cameraTrack: videoTrack,
          microphoneTrack: audioTrack,
        };

      case 'listening':
      case 'thinking':
      case 'speaking':
        return {
          ...common,
          identity: agentParticipantIdentity!,
          name: agentParticipantName,
          metadata: agentParticipantMetadata,

          state,
          ...generateDerivedStateValues(state),
          failureReasons: null,

          cameraTrack: videoTrack,
          microphoneTrack: audioTrack,
        };

      default:
        // Unreachable: when a call is connected, `state` is always a voice state (the text states and
        // `disconnected` are handled above). Fall back to a safe idle.
        return {
          ...common,
          identity: undefined,
          name: undefined,
          metadata: undefined,

          state: 'idle',
          failureReasons: null,
          isConnected: false,
          canListen: false,
          isFinished: false,
          isPending: false,

          cameraTrack: undefined,
          microphoneTrack: undefined,
        };
    }
  }, [
    agentParticipantIdentity,
    agentParticipantName,
    agentParticipantMetadata,
    agentParticipantAttributes,
    emitter,
    agentParticipant,
    workerParticipant,
    callConnected,
    failureReasons,
    state,
    videoTrack,
    audioTrack,
  ]);

  const { waitUntilConnected, waitUntilCouldBeListening, waitUntilFinished } =
    useAgentWaitUntilDerivedStates(emitter, state);

  const waitUntilCamera = React.useCallback(
    (signal?: AbortSignal) => {
      return new Promise<TrackReference>((resolve, reject) => {
        const stateChangedHandler = (camera: TrackReference | undefined) => {
          if (!camera) {
            return;
          }
          cleanup();
          resolve(camera);
        };
        const abortHandler = () => {
          cleanup();
          reject(new Error('useAgent(/* ... */).waitUntilCamera - signal aborted'));
        };

        const cleanup = () => {
          emitter.off(AgentEvent.CameraChanged, stateChangedHandler);
          signal?.removeEventListener('abort', abortHandler);
        };

        emitter.on(AgentEvent.CameraChanged, stateChangedHandler);
        signal?.addEventListener('abort', abortHandler);
      });
    },
    [emitter],
  );

  const waitUntilMicrophone = React.useCallback(
    (signal?: AbortSignal) => {
      return new Promise<TrackReference>((resolve, reject) => {
        const stateChangedHandler = (microphone: TrackReference | undefined) => {
          if (!microphone) {
            return;
          }
          cleanup();
          resolve(microphone);
        };
        const abortHandler = () => {
          cleanup();
          reject(new Error('useAgent(/* ... */).waitUntilMicrophone - signal aborted'));
        };

        const cleanup = () => {
          emitter.off(AgentEvent.MicrophoneChanged, stateChangedHandler);
          signal?.removeEventListener('abort', abortHandler);
        };

        emitter.on(AgentEvent.MicrophoneChanged, stateChangedHandler);
        signal?.addEventListener('abort', abortHandler);
      });
    },
    [emitter],
  );

  return React.useMemo(() => {
    return {
      ...agentState,
      waitUntilConnected,
      waitUntilCouldBeListening,
      waitUntilFinished,
      waitUntilCamera,
      waitUntilMicrophone,
    };
  }, [
    agentState,
    waitUntilConnected,
    waitUntilCouldBeListening,
    waitUntilFinished,
    waitUntilCamera,
    waitUntilMicrophone,
  ]);
}
