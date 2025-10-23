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
 *   connecting ➡️ listening ➡️ initializing/listening/thinking/speaking
 *
 * For agents without the preconnect audio feature enabled:
 *   connecting ➡️ initializing ➡️ idle/listening/thinking/speaking
 *
 * If an agent fails to connect:
 *   connecting ➡️ listening/initializing ➡️ failed
 *
 * Legacy useVoiceAssistant hook:
 *   disconnected ➡️ connecting ➡️ initializing ➡️ listening/thinking/speaking
 *
 * @public
 * */
export type AgentState = 'disconnected' | 'connecting' | 'failed' | AgentSdkStates;

/** @public */
export enum AgentEvent {
  CameraChanged = 'cameraChanged',
  MicrophoneChanged = 'microphoneChanged',
  StateChanged = 'stateChanged',
}

/** @public */
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
  state: 'thinking' | 'speaking';
  failureReasons: null;

  /** Is the agent ready for user interaction? */
  isAvailable: true;

  /** Is the audio preconnect buffer currently active and recording because the agent hasn't
   * connected yet? */
  isBufferingSpeech: false;

  cameraTrack?: TrackReference;
  microphoneTrack?: TrackReference;
};

type AgentStateAvailableListening = AgentStateCommon & {
  state: 'listening';
  failureReasons: null;

  /** Is the agent ready for user interaction? */
  isAvailable: true;

  /** Is the audio preconnect buffer currently active and recording because the agent hasn't
   * connected yet? */
  isBufferingSpeech: boolean;

  cameraTrack?: TrackReference;
  microphoneTrack?: TrackReference;
};

type AgentStateUnAvailable = AgentStateCommon & {
  state: 'initializing' | 'idle';
  failureReasons: null;

  /** Is the agent ready for user interaction? */
  isAvailable: false;

  /** Is the audio preconnect buffer currently active and recording because the agent hasn't
   * connected yet? */
  isBufferingSpeech: false;

  cameraTrack?: TrackReference;
  microphoneTrack?: TrackReference;
};

type AgentStateConnecting = AgentStateCommon & {
  state: 'disconnected' | 'connecting';
  failureReasons: null;

  /** Is the agent ready for user interaction? */
  isAvailable: false;

  /** Is the audio preconnect buffer currently active and recording because the agent hasn't
   * connected yet? */
  isBufferingSpeech: false;

  cameraTrack: undefined;
  microphoneTrack: undefined;
};

type AgentStateFailed = AgentStateCommon & {
  state: 'failed';
  failureReasons: Array<string>;

  /** Is the agent ready for user interaction? */
  isAvailable: false;

  /** Is the audio preconnect buffer currently active and recording because the agent hasn't
   * connected yet? */
  isBufferingSpeech: false;

  cameraTrack: undefined;
  microphoneTrack: undefined;
};

type AgentActions = {
  /** Returns a promise that resolves once the agent is available for interaction */
  waitUntilAvailable: (signal?: AbortSignal) => Promise<void>;

  /** Returns a promise that resolves once the agent has published a camera track */
  waitUntilCamera: (signal?: AbortSignal) => Promise<TrackReference>;

  /** Returns a promise that resolves once the agent has published a microphone track */
  waitUntilMicrophone: (signal?: AbortSignal) => Promise<TrackReference>;
};

type AgentStateCases =
  | AgentStateConnecting
  | AgentStateAvailable
  | AgentStateAvailableListening
  | AgentStateUnAvailable
  | AgentStateFailed;

/** @public */
export type UseAgentReturn = AgentStateCases & AgentActions;

const generateDerivedStateValues = <State extends AgentState>(state: State) =>
  ({
    isAvailable: state === 'listening' || state === 'thinking' || state === 'speaking',
  }) as {
    isAvailable: State extends 'listening' | 'thinking' | 'speaking' ? true : false;
  };

/** Internal hook used by useSession to store global agent state */
export const useAgentTimeoutIdStore = (): {
  agentTimeoutFailureReason: string | null;
  startAgentTimeout: (agentConnectTimeoutMilliseconds?: number) => void;
  clearAgentTimeout: () => void;
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

      const { isAvailable } = generateDerivedStateValues(agentStateRef.current);
      if (!isAvailable) {
        setAgentTimeoutFailureReason('Agent connected but did not complete initializing.');
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

    updateAgentTimeoutState: React.useCallback((agentState: AgentState) => {
      agentStateRef.current = agentState;
    }, []),
    updateAgentTimeoutParticipantExists: React.useCallback((agentParticipantExists: boolean) => {
      agentParticipantExistsRef.current = agentParticipantExists;
    }, []),
  };
};

type SessionStub = Pick<UseSessionReturn, 'connectionState' | 'room' | 'internal'>;

/**
 * useAgent encapculates all agent state, normalizing some quirks around how LiveKit Agents work.
 * @public
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
    return agentTimeoutFailureReason ? [agentTimeoutFailureReason] : [];
  }, [agentTimeoutFailureReason]);

  const [state, isBufferingSpeech] = React.useMemo(() => {
    if (failureReasons.length > 0) {
      return ['failed' as const, false];
    }

    let state: AgentState = 'disconnected';
    let bufferingSpeachLocally = false;

    if (roomConnectionState !== ConnectionState.Disconnected) {
      state = 'connecting';
    }

    // If the microphone preconnect buffer is active, then the state should be "listening" rather
    // than "initializing"
    if (localMicTrack) {
      state = 'listening';
      bufferingSpeachLocally = true;
    }

    if (agentParticipant && agentParticipantAttributes[ParticipantAgentAttributes.AgentState]) {
      state = agentParticipantAttributes[ParticipantAgentAttributes.AgentState] as AgentSdkStates;
      bufferingSpeachLocally = false;
    }

    return [state, bufferingSpeachLocally] as [AgentState, boolean];
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
      case 'connecting':
        return {
          ...common,

          state,
          ...generateDerivedStateValues(state),
          isBufferingSpeech: false,
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
          isBufferingSpeech: false,
          failureReasons: null,

          cameraTrack: videoTrack,
          microphoneTrack: audioTrack,
        };

      case 'listening':
        return {
          ...common,

          state,
          ...generateDerivedStateValues(state),
          isBufferingSpeech,
          failureReasons: null,

          cameraTrack: videoTrack,
          microphoneTrack: audioTrack,
        };

      case 'thinking':
      case 'speaking':
        return {
          ...common,

          state,
          ...generateDerivedStateValues(state),
          isBufferingSpeech: false,
          failureReasons: null,

          cameraTrack: videoTrack,
          microphoneTrack: audioTrack,
        };

      case 'failed':
        return {
          ...common,

          state: 'failed',
          ...generateDerivedStateValues('failed'),
          isBufferingSpeech: false,
          failureReasons,

          // Clear inner values if no longer connected
          cameraTrack: undefined,
          microphoneTrack: undefined,
        };
    }
  }, [
    agentParticipantAttributes,
    emitter,
    agentParticipant,

    state,
    videoTrack,
    audioTrack,
    isBufferingSpeech,
  ]);

  const waitUntilAvailable = React.useCallback(
    async (signal?: AbortSignal) => {
      const { isAvailable } = generateDerivedStateValues(state);
      if (isAvailable) {
        return;
      }

      return new Promise<void>((resolve, reject) => {
        const stateChangedHandler = (state: AgentState) => {
          const { isAvailable } = generateDerivedStateValues(state);
          if (!isAvailable) {
            return;
          }
          cleanup();
          resolve();
        };
        const abortHandler = () => {
          cleanup();
          reject(new Error('useAgent.waitUntilAvailable - signal aborted'));
        };

        const cleanup = () => {
          emitter.off(AgentEvent.StateChanged, stateChangedHandler);
          signal?.removeEventListener('abort', abortHandler);
        };

        emitter.on(AgentEvent.StateChanged, stateChangedHandler);
        signal?.addEventListener('abort', abortHandler);
      });
    },
    [state, emitter],
  );

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
          reject(new Error('useAgent.waitUntilCamera - signal aborted'));
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
          reject(new Error('useAgent.waitUntilMicrophone - signal aborted'));
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
      waitUntilAvailable,
      waitUntilCamera,
      waitUntilMicrophone,
    };
  }, [agentState, waitUntilAvailable, waitUntilCamera, waitUntilMicrophone]);
}
