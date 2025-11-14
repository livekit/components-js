import {
  ConnectionState,
  LocalTrackPublication,
  ParticipantEvent,
  ParticipantKind,
  RemoteParticipant,
  RoomEvent,
  Track,
} from 'livekit-client';
import type TypedEventEmitter from 'typed-emitter';
import { EventEmitter } from 'events';
import * as React from 'react';
import { ParticipantAgentAttributes, TrackReference } from '@livekit/components-core';

import { useParticipantTracks } from './useParticipantTracks';
import { useRemoteParticipants } from './useRemoteParticipants';
import { UseSessionReturn } from './useSession';
import { useMaybeSessionContext } from '../context';

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
 * Legacy useVoiceAssistant hook:
 *   disconnected ➡️ connecting ➡️ initializing ➡️ listening/thinking/speaking
 *
 * @beta
 * */
export type AgentState =
  | 'disconnected'
  | 'connecting'
  | 'pre-connect-buffering'
  | 'failed'
  | AgentSdkStates;

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
  attributes: Record<string, string>;

  internal: {
    emitter: TypedEventEmitter<AgentCallbacks>;

    agentParticipant: RemoteParticipant | null;
    workerParticipant: RemoteParticipant | null;
  };
};

type AgentStateAvailable = AgentStateCommon & {
  state: 'listening' | 'thinking' | 'speaking';
  failureReasons: null;

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
  | AgentStateFailed;

/** @beta */
export type UseAgentReturn = AgentStateCases & AgentActions;

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

type SessionStub = Pick<UseSessionReturn, 'connectionState' | 'room' | 'internal'>;

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

/**
 * useAgent encapculates all agent state, normalizing some quirks around how LiveKit Agents work.
 * @beta
 */
export function useAgent(session?: SessionStub): UseAgentReturn {
  const sessionFromContext = useMaybeSessionContext();
  session = session ?? sessionFromContext;
  if (!session) {
    throw new Error(
      'No session provided, make sure you are inside a Session context or pass the session explicitly',
    );
  }

  const {
    room,
    internal: {
      agentConnectTimeoutMilliseconds,

      agentTimeoutFailureReason,
      startAgentTimeout,
      clearAgentTimeout,
      clearAgentTimeoutFailureReason,
      updateAgentTimeoutState,
      updateAgentTimeoutParticipantExists,
    },
  } = session;

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

  // 1. Listen for agent participant attribute changes
  const [agentParticipantAttributes, setAgentParticipantAttributes] = React.useState<
    Record<string, string>
  >({});
  React.useEffect(() => {
    if (!agentParticipant) {
      return;
    }

    const handleAttributesChanged = (attributes: UseAgentReturn['attributes']) => {
      setAgentParticipantAttributes(attributes);
    };

    agentParticipant.on(ParticipantEvent.AttributesChanged, handleAttributesChanged);
    return () => {
      agentParticipant.off(ParticipantEvent.AttributesChanged, handleAttributesChanged);
    };
  }, [agentParticipant, emitter]);

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

    clearAgentTimeoutFailureReason();
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

  const state = React.useMemo(() => {
    if (failureReasons.length > 0) {
      return 'failed';
    }

    let state: AgentState = 'disconnected';

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
    roomConnectionState,
    localMicTrack,
    agentParticipant,
    agentParticipantAttributes,
  ]);

  React.useEffect(() => {
    emitter.emit(AgentEvent.StateChanged, state);
    updateAgentTimeoutState(state);
  }, [emitter, state]);
  React.useEffect(() => {
    updateAgentTimeoutParticipantExists(agentParticipant !== null);
  }, [agentParticipant]);

  // When the session room begins connecting, start the agent timeout
  const isSessionDisconnected = session.connectionState === 'disconnected';
  React.useEffect(() => {
    if (isSessionDisconnected) {
      return;
    }

    startAgentTimeout(agentConnectTimeoutMilliseconds);
    return () => {
      clearAgentTimeout();
    };
  }, [isSessionDisconnected, agentConnectTimeoutMilliseconds]);

  const agentState: AgentStateCases = React.useMemo(() => {
    const common: AgentStateCommon = {
      attributes: agentParticipantAttributes,

      internal: {
        agentParticipant,
        workerParticipant,
        emitter,
      },
    };

    switch (state) {
      case 'disconnected':
        return {
          ...common,

          state,
          ...generateDerivedStateValues(state),
          failureReasons: null,

          // Clear inner values if no longer connected
          cameraTrack: undefined,
          microphoneTrack: undefined,
        };

      case 'connecting':
        return {
          ...common,

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

          state,
          ...generateDerivedStateValues(state),
          failureReasons: null,

          cameraTrack: videoTrack,
          microphoneTrack: audioTrack,
        };

      case 'pre-connect-buffering':
        return {
          ...common,

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

          state,
          ...generateDerivedStateValues(state),
          failureReasons: null,

          cameraTrack: videoTrack,
          microphoneTrack: audioTrack,
        };

      case 'failed':
        return {
          ...common,

          state: 'failed',
          ...generateDerivedStateValues('failed'),
          failureReasons,

          // Clear inner values if no longer connected
          cameraTrack: undefined,
          microphoneTrack: undefined,
        };
    }
  }, [agentParticipantAttributes, emitter, agentParticipant, state, videoTrack, audioTrack]);

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
