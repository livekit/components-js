import { ConnectionState, LocalTrackPublication, ParticipantEvent, ParticipantKind, RemoteParticipant, RoomEvent, Track } from 'livekit-client';
import type TypedEventEmitter from 'typed-emitter';
import { EventEmitter } from 'events';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { create } from 'zustand';
import { ParticipantAgentAttributes, TrackReference } from '@livekit/components-core';

import { useParticipantTracks } from './useParticipantTracks';
import { useRemoteParticipants } from './useRemoteParticipants';
import { AgentState as LegacyAgentState } from './useVoiceAssistant';
import { ConversationInstance } from './useConversationWith';

// FIXME: make this 10 seconds once room dispatch booting info is discoverable
const DEFAULT_AGENT_CONNECT_TIMEOUT_MILLISECONDS = 20_000;

/** State representing the current status of the agent, whether it is ready for speach, etc */
export type AgentStateNew = 'unset' | 'initializing' | 'failed' | 'idle' | 'listening' | 'thinking' | 'speaking';

export enum AgentEvent {
  CameraChanged = 'cameraChanged',
  MicrophoneChanged = 'microphoneChanged',
  AttributesChanged = 'attributesChanged',
  StateChanged = 'lifecycleStateChanged',
}

export type AgentCallbacks = {
  [AgentEvent.CameraChanged]: (newTrack: TrackReference | null) => void;
  [AgentEvent.MicrophoneChanged]: (newTrack: TrackReference | null) => void;
  [AgentEvent.AttributesChanged]: (newAttributes: Record<string, string>) => void;
  [AgentEvent.StateChanged]: (newAgentState: AgentStateNew) => void;
};

type AgentInstanceCommon = {
  [Symbol.toStringTag]: "AgentInstance";

  // FIXME: maybe add some sort of schema to this?
  attributes: Record<string, string>;

  subtle: {
    emitter: TypedEventEmitter<AgentCallbacks>;

    agentParticipant: RemoteParticipant | null;
    workerParticipant: RemoteParticipant | null;

    /** A computed version of the old {@link AgentState} value returned by {@link useVoiceAssistant}
      * @deprecated Use conversation.connectionState / agent.lifecycleState if at all possible
      */
    legacyAgentState: LegacyAgentState;
  };
};

type AgentStateAvailable = AgentInstanceCommon & {
  state: "listening" | "thinking" | "speaking";
  failureReasons: null;

  /** Is the agent ready for user interaction? */
  isAvailable: true;

  camera: TrackReference | null;
  microphone: TrackReference | null;
};

type AgentStateUnAvailable = AgentInstanceCommon & {
  state: "unset" | "initializing" | "idle";
  failureReasons: null;

  /** Is the agent ready for user interaction? */
  isAvailable: false;

  camera: null;
  microphone: null;
};

type AgentStateFailed = AgentInstanceCommon & {
  state: "failed";
  failureReasons: Array<string>;

  /** Is the agent ready for user interaction? */
  isAvailable: false;

  camera: null;
  microphone: null;
};

type AgentActions = {
  /** Returns a promise that resolves once the agent is available for interaction */
  waitUntilAvailable: (signal?: AbortSignal) => Promise<void>;

  /** Returns a promise that resolves once the agent has published a camera track */
  waitUntilCamera: (signal?: AbortSignal) => Promise<TrackReference>;

  /** Returns a promise that resolves once the agent has published a microphone track */
  waitUntilMicrophone: (signal?: AbortSignal) => Promise<TrackReference>;
};

type AgentStateCases = AgentStateAvailable | AgentStateUnAvailable | AgentStateFailed;
export type AgentInstance = AgentStateCases & AgentActions;

const generateDerivedStateValues = <State extends AgentStateNew>(state: State) => ({
  isAvailable: (
    state === 'listening' ||
    state === 'thinking' ||
    state === 'speaking'
  ),
} as {
  isAvailable: State extends 'listening' | 'thinking' | 'speaking' ? true : false,
});

const useAgentTimeoutIdStore = create<{
  agentTimeoutFailureReason: string | null,
  startAgentTimeout: (agentConnectTimeoutMilliseconds?: number) => void;
  clearAgentTimeout: () => void;
  updateAgentTimeoutState: (agentState: AgentStateNew) => void;
  updateAgentTimeoutParticipantExists: (agentParticipantExists: boolean) => void;
  subtle: {
    agentTimeoutId: ReturnType<typeof setTimeout> | null;
    agentState: AgentStateNew;
    agentParticipantExists: boolean;
  };
}>((set, get) => {
  const startAgentConnectedTimeout = (agentConnectTimeoutMilliseconds?: number) => {
    return setTimeout(() => {
      const { subtle: { agentState: agentConversationalState, agentParticipantExists } } = get();
      if (!agentParticipantExists) {
        set((old) => ({ ...old, agentTimeoutFailureReason: 'Agent did not join the room.' }));
        return;
      }

      const { isAvailable } = generateDerivedStateValues(agentConversationalState);
      if (!isAvailable) {
        set((old) => ({ ...old, agentTimeoutFailureReason: 'Agent connected but did not complete initializing.' }));
        return;
      }
    }, agentConnectTimeoutMilliseconds ?? DEFAULT_AGENT_CONNECT_TIMEOUT_MILLISECONDS);
  };

  return {
    agentTimeoutFailureReason: null,
    startAgentTimeout: (agentConnectTimeoutMilliseconds?: number) => {
      set((old) => {
        if (old.subtle.agentTimeoutId) {
          clearTimeout(old.subtle.agentTimeoutId);
        }

        return {
          ...old,
          agentTimeoutFailureReason: null,
          subtle: {
            ...old.subtle,
            agentTimeoutId: startAgentConnectedTimeout(agentConnectTimeoutMilliseconds),
            agentState: 'unset',
            agentParticipantExists: false,
          },
        };
      });
    },
    clearAgentTimeout: () => {
      set((old) => {
        if (old.subtle.agentTimeoutId) {
          clearTimeout(old.subtle.agentTimeoutId);
        }
        return {
          ...old,
          agentTimeoutFailureReason: null,
          subtle: {
            ...old.subtle,
            agentTimeoutId: null,
            agentState: 'unset',
            agentParticipantExists: false,
          },
        };
      });
    },

    updateAgentTimeoutState: (agentState: AgentStateNew) => {
      set((old) => ({ ...old, subtle: { ...old.subtle, agentState: agentState } }));
    },
    updateAgentTimeoutParticipantExists: (agentParticipantExists: boolean) => {
      set((old) => ({ ...old, subtle: { ...old.subtle, agentParticipantExists } }));
    },

    subtle: {
      agentTimeoutId: null,
      agentState: 'unset',
      agentParticipantExists: false,
    },
  };
});

type ConversationStub = Pick<ConversationInstance, 'connectionState' | 'subtle'>;

/**
  * useAgent encapculates all agent state, normalizing some quirks around how LiveKit Agents work.
  */
export function useAgent(conversation: ConversationStub, _name?: string): AgentInstance {
  const { room } = conversation.subtle;

  const emitter = useMemo(() => new EventEmitter() as TypedEventEmitter<AgentCallbacks>, []);

  const roomRemoteParticipants = useRemoteParticipants({ room });

  const agentParticipant = useMemo(() => {
    return roomRemoteParticipants.find(
      (p) => p.kind === ParticipantKind.AGENT && !(ParticipantAgentAttributes.PublishOnBehalf in p.attributes),
    ) ?? null;
  }, [roomRemoteParticipants]);
  const workerParticipant = useMemo(() => {
    if (!agentParticipant) {
      return null;
    }
    return roomRemoteParticipants.find(
      (p) => p.kind === ParticipantKind.AGENT && p.attributes[ParticipantAgentAttributes.PublishOnBehalf] === agentParticipant.identity,
    ) ?? null;
  }, [agentParticipant, roomRemoteParticipants]);

  // 1. Listen for agent participant attribute changes
  const [agentParticipantAttributes, setAgentParticipantAttributes] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!agentParticipant) {
      return;
    }

    const handleAttributesChanged = (attributes: AgentInstance["attributes"]) => {
      setAgentParticipantAttributes(attributes);
      emitter.emit(AgentEvent.AttributesChanged, attributes);
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

  const videoTrack = useMemo(() => (
    agentTracks.find((t) => t.source === Track.Source.Camera) ??
    workerTracks.find((t) => t.source === Track.Source.Camera) ?? null
  ), [agentTracks, workerTracks]);
  useEffect(() => {
    emitter.emit(AgentEvent.CameraChanged, videoTrack);
  }, [emitter, videoTrack]);

  const audioTrack = useMemo(() => (
    agentTracks.find((t) => t.source === Track.Source.Microphone) ??
    workerTracks.find((t) => t.source === Track.Source.Microphone) ?? null
  ), [agentTracks, workerTracks]);
  useEffect(() => {
    emitter.emit(AgentEvent.MicrophoneChanged, audioTrack);
  }, [emitter, audioTrack]);

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

  const [localMicTrack, setLocalMicTrack] = useState<LocalTrackPublication | null>(() => (
    room.localParticipant.getTrackPublication(Track.Source.Microphone) ?? null
  ));
  useEffect(() => {
    const handleLocalParticipantTrackPublished = () => {
      setLocalMicTrack(room.localParticipant.getTrackPublication(Track.Source.Microphone) ?? null);
    };
    const handleLocalParticipantTrackUnPublished = () => {
      setLocalMicTrack(null);
    };

    room.localParticipant.on(ParticipantEvent.LocalTrackPublished, handleLocalParticipantTrackPublished)
    room.localParticipant.on(ParticipantEvent.LocalTrackUnpublished, handleLocalParticipantTrackUnPublished)
    return () => {
      room.localParticipant.off(ParticipantEvent.LocalTrackPublished, handleLocalParticipantTrackPublished)
      room.localParticipant.off(ParticipantEvent.LocalTrackUnpublished, handleLocalParticipantTrackUnPublished)
    };
  }, [room.localParticipant]);

  const {
    agentTimeoutFailureReason,
    startAgentTimeout,
    clearAgentTimeout,
    updateAgentTimeoutState: updateAgentTimeoutConversationalState,
    updateAgentTimeoutParticipantExists,
  } = useAgentTimeoutIdStore();

  const failureReasons = useMemo(() => {
    return agentTimeoutFailureReason ? [ agentTimeoutFailureReason ] : [];
  }, [agentTimeoutFailureReason]);

  const state = useMemo(() => {
    if (failureReasons.length > 0) {
      return 'failed';
    }

    let newState: AgentStateNew = 'unset';

    if (roomConnectionState !== ConnectionState.Disconnected) {
      newState = 'initializing';
    }

    // If the microphone preconnect buffer is active, then the state should be "listening" rather
    // than "initializing"
    if (localMicTrack) {
      newState = 'listening';
    }

    if (agentParticipant && agentParticipantAttributes[ParticipantAgentAttributes.AgentState]) {
      // ref: https://github.com/livekit/agents/blob/65170238db197f62f479eb7aaef1c0e18bfad6e7/livekit-agents/livekit/agents/voice/events.py#L97
      const agentState = agentParticipantAttributes[ParticipantAgentAttributes.AgentState] as 'initializing' | 'idle' | 'listening' | 'thinking' | 'speaking';
      newState = agentState;
    }

    return newState;
  }, [failureReasons, roomConnectionState, localMicTrack, agentParticipant, agentParticipantAttributes]);

  useEffect(() => {
    emitter.emit(AgentEvent.StateChanged, state);
    updateAgentTimeoutConversationalState(state);
  }, [emitter, state]);
  useEffect(() => {
    updateAgentTimeoutParticipantExists(agentParticipant !== null);
  }, [agentParticipant]);

  // When the conversation room begins connecting, start the agent timeout
  const isConversationDisconnected = conversation.connectionState === "disconnected";
  useEffect(() => {
    if (isConversationDisconnected) {
      return;
    }

    startAgentTimeout(conversation.subtle.agentConnectTimeoutMilliseconds);
    return () => {
      clearAgentTimeout();
    };
  }, [isConversationDisconnected, conversation.subtle.agentConnectTimeoutMilliseconds]);

  const legacyAgentState: LegacyAgentState = useMemo(() => {
    switch (conversation.connectionState) {
      case ConnectionState.Disconnected:
      case ConnectionState.Connecting:
        return conversation.connectionState;

      case ConnectionState.Connected:
      case ConnectionState.Reconnecting:
      case ConnectionState.SignalReconnecting:
        switch (state) {
          case 'speaking':
          case 'listening':
          case 'initializing':
          case 'thinking':
            return state;

          case 'idle':
          case 'unset':
          case 'failed':
            // There's not really a good direct correlation for either of these...
            return 'disconnected';
        }
    }
  }, [conversation.connectionState, state]);

  const agentState: AgentStateCases = useMemo(() => {
    const common: AgentInstanceCommon = {
      [Symbol.toStringTag]: "AgentInstance",

      attributes: agentParticipantAttributes,

      subtle: {
        emitter,
        agentParticipant,
        workerParticipant,
        legacyAgentState,
      },
    };

    switch (state) {
      case 'listening':
      case 'thinking':
      case 'speaking':
        return {
          ...common,

          state,
          ...generateDerivedStateValues(state),
          failureReasons: null,

          camera: videoTrack,
          microphone: audioTrack,
        };

      case 'unset':
      case 'initializing':
      case 'idle':
        return {
          ...common,

          state,
          ...generateDerivedStateValues(state),
          failureReasons: null,

          // Clear inner values if no longer connected
          camera: null,
          microphone: null,
        };

      case 'failed':
        return {
          ...common,

          state: 'failed',
          ...generateDerivedStateValues('failed'),
          failureReasons,

          // Clear inner values if no longer connected
          camera: null,
          microphone: null,
        };
    }
  }, [
    agentParticipantAttributes,
    emitter,
    agentParticipant,

    state,
    videoTrack,
    audioTrack,
  ]);

  const waitUntilAvailable = useCallback(async (signal?: AbortSignal) => {
    const { isAvailable } = generateDerivedStateValues(state);
    if (isAvailable) {
      return;
    }

    return new Promise<void>((resolve, reject) => {
      const stateChangedHandler = (state: AgentStateNew) => {
        const { isAvailable } = generateDerivedStateValues(state);
        if (!isAvailable) {
          return;
        }
        cleanup();
        resolve();
      };
      const abortHandler = () => {
        cleanup();
        reject(new Error('AgentInstance.waitUntilAvailable - signal aborted'));
      };

      const cleanup = () => {
        emitter.off(AgentEvent.StateChanged, stateChangedHandler);
        signal?.removeEventListener('abort', abortHandler);
      };

      emitter.on(AgentEvent.StateChanged, stateChangedHandler);
      signal?.addEventListener('abort', abortHandler);
    });
  }, [state, emitter]);

  const waitUntilCamera = useCallback((signal?: AbortSignal) => {
    return new Promise<TrackReference>((resolve, reject) => {
      const stateChangedHandler = (camera: TrackReference | null) => {
        if (!camera) {
          return;
        }
        cleanup();
        resolve(camera);
      };
      const abortHandler = () => {
        cleanup();
        reject(new Error('AgentInstance.waitUntilCamera - signal aborted'));
      };

      const cleanup = () => {
        emitter.off(AgentEvent.CameraChanged, stateChangedHandler);
        signal?.removeEventListener('abort', abortHandler);
      };

      emitter.on(AgentEvent.CameraChanged, stateChangedHandler);
      signal?.addEventListener('abort', abortHandler);
    });
  }, [emitter]);

  const waitUntilMicrophone = useCallback((signal?: AbortSignal) => {
    return new Promise<TrackReference>((resolve, reject) => {
      const stateChangedHandler = (microphone: TrackReference | null) => {
        if (!microphone) {
          return;
        }
        cleanup();
        resolve(microphone);
      };
      const abortHandler = () => {
        cleanup();
        reject(new Error('AgentInstance.waitUntilMicrophone - signal aborted'));
      };

      const cleanup = () => {
        emitter.off(AgentEvent.MicrophoneChanged, stateChangedHandler);
        signal?.removeEventListener('abort', abortHandler);
      };

      emitter.on(AgentEvent.MicrophoneChanged, stateChangedHandler);
      signal?.addEventListener('abort', abortHandler);
    });
  }, [emitter]);

  return useMemo(() => {
    return {
      ...agentState,
      waitUntilAvailable,
      waitUntilCamera,
      waitUntilMicrophone,
    };
  }, [
    agentState,
    waitUntilAvailable,
    waitUntilCamera,
    waitUntilMicrophone,
  ]);
}
