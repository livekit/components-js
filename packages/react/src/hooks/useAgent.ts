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
export type AgentLifecycleState = 'unset' | 'initializing' | 'failed' | 'idle' | 'listening' | 'thinking' | 'speaking';

export enum AgentEvent {
  CameraChanged = 'cameraChanged',
  MicrophoneChanged = 'microphoneChanged',
  AttributesChanged = 'attributesChanged',
  ConversationalStateChanged = 'lifecycleStateChanged',
}

export type AgentCallbacks = {
  [AgentEvent.CameraChanged]: (newTrack: TrackReference<Track.Source.Camera, RemoteParticipant> | null) => void;
  [AgentEvent.MicrophoneChanged]: (newTrack: TrackReference<Track.Source.Microphone, RemoteParticipant> | null) => void;
  [AgentEvent.AttributesChanged]: (newAttributes: Record<string, string>) => void;
  [AgentEvent.ConversationalStateChanged]: (newAgentConversationalState: AgentLifecycleState) => void;
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
  lifecycleState: "listening" | "thinking" | "speaking";
  failureReasons: null;

  /** Is the agent ready for user interaction? */
  isAvailable: true;

  camera: TrackReference<Track.Source.Camera, RemoteParticipant> | null;
  microphone: TrackReference<Track.Source.Microphone, RemoteParticipant> | null;
};

type AgentStateUnAvailable = AgentInstanceCommon & {
  lifecycleState: "unset" | "initializing" | "idle";
  failureReasons: null;

  /** Is the agent ready for user interaction? */
  isAvailable: false;

  camera: null;
  microphone: null;
};

type AgentStateFailed = AgentInstanceCommon & {
  lifecycleState: "failed";
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
  waitUntilCamera: (signal?: AbortSignal) => Promise<TrackReference<Track.Source.Camera, RemoteParticipant>>;

  /** Returns a promise that resolves once the agent has published a microphone track */
  waitUntilMicrophone: (signal?: AbortSignal) => Promise<TrackReference<Track.Source.Microphone, RemoteParticipant>>;
};

type AgentState = AgentStateAvailable | AgentStateUnAvailable | AgentStateFailed;
export type AgentInstance = AgentState & AgentActions;

const generateDerivedLifecycleStateValues = <LifecycleState extends AgentLifecycleState>(lifecycleState: LifecycleState) => ({
  isAvailable: (
    lifecycleState === 'listening' ||
    lifecycleState === 'thinking' ||
    lifecycleState === 'speaking'
  ),
} as {
  isAvailable: LifecycleState extends 'listening' | 'thinking' | 'speaking' ? true : false,
});

const useAgentTimeoutIdStore = create<{
  agentTimeoutFailureReason: string | null,
  startAgentTimeout: (agentConnectTimeoutMilliseconds?: number) => void;
  clearAgentTimeout: () => void;
  updateAgentTimeoutConversationalState: (agentConversationalState: AgentLifecycleState) => void;
  updateAgentTimeoutParticipantExists: (agentParticipantExists: boolean) => void;
  subtle: {
    agentTimeoutId: ReturnType<typeof setTimeout> | null;
    agentConversationalState: AgentLifecycleState;
    agentParticipantExists: boolean;
  };
}>((set, get) => {
  const startAgentConnectedTimeout = (agentConnectTimeoutMilliseconds?: number) => {
    return setTimeout(() => {
      const { subtle: { agentConversationalState, agentParticipantExists } } = get();
      if (!agentParticipantExists) {
        set((old) => ({ ...old, agentTimeoutFailureReason: 'Agent did not join the room.' }));
        return;
      }

      const { isAvailable } = generateDerivedLifecycleStateValues(agentConversationalState);
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
            agentConversationalState: 'unset',
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
            agentConversationalState: 'unset',
            agentParticipantExists: false,
          },
        };
      });
    },

    updateAgentTimeoutConversationalState: (agentConversationalState: AgentLifecycleState) => {
      set((old) => ({ ...old, subtle: { ...old.subtle, agentConversationalState } }));
    },
    updateAgentTimeoutParticipantExists: (agentParticipantExists: boolean) => {
      set((old) => ({ ...old, subtle: { ...old.subtle, agentParticipantExists } }));
    },

    subtle: {
      agentTimeoutId: null,
      agentConversationalState: 'unset',
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
  ) as TrackReference<Track.Source.Camera, RemoteParticipant> | null, [agentTracks, workerTracks]);
  useEffect(() => {
    emitter.emit(AgentEvent.CameraChanged, videoTrack);
  }, [emitter, videoTrack]);

  const audioTrack = useMemo(() => (
    agentTracks.find((t) => t.source === Track.Source.Microphone) ??
    workerTracks.find((t) => t.source === Track.Source.Microphone) ?? null
  ) as TrackReference<Track.Source.Microphone, RemoteParticipant> | null, [agentTracks, workerTracks]);
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
    updateAgentTimeoutConversationalState,
    updateAgentTimeoutParticipantExists,
  } = useAgentTimeoutIdStore();

  const failureReasons = useMemo(() => {
    return agentTimeoutFailureReason ? [ agentTimeoutFailureReason ] : [];
  }, [agentTimeoutFailureReason]);

  const lifecycleState = useMemo(() => {
    if (failureReasons.length > 0) {
      return 'failed';
    }

    let newConversationalState: AgentLifecycleState = 'unset';

    if (roomConnectionState !== ConnectionState.Disconnected) {
      newConversationalState = 'initializing';
    }

    // If the microphone preconnect buffer is active, then the state should be "listening" rather
    // than "initializing"
    if (localMicTrack) {
      newConversationalState = 'listening';
    }

    if (agentParticipant && agentParticipantAttributes[ParticipantAgentAttributes.AgentState]) {
      // ref: https://github.com/livekit/agents/blob/65170238db197f62f479eb7aaef1c0e18bfad6e7/livekit-agents/livekit/agents/voice/events.py#L97
      const agentState = agentParticipantAttributes[ParticipantAgentAttributes.AgentState] as 'initializing' | 'idle' | 'listening' | 'thinking' | 'speaking';
      newConversationalState = agentState;
    }

    return newConversationalState;
  }, [failureReasons, roomConnectionState, localMicTrack, agentParticipant, agentParticipantAttributes]);

  useEffect(() => {
    console.log('AGENT TIMEOUT FAILURE REASON:', lifecycleState);
    emitter.emit(AgentEvent.ConversationalStateChanged, lifecycleState);
    updateAgentTimeoutConversationalState(lifecycleState);
  }, [emitter, lifecycleState]);
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
      case 'disconnected':
      case 'connecting':
        return conversation.connectionState;

      case 'connected':
      case 'reconnecting':
      case 'signalReconnecting':
        switch (lifecycleState) {
          case 'speaking':
          case 'listening':
          case 'initializing':
          case 'thinking':
            return lifecycleState;

          case 'idle':
          case 'unset':
          case 'failed':
            // There's not really a good direct correlation for either of these...
            return 'disconnected';
        }
    }
  }, [conversation.connectionState, lifecycleState]);

  const agentState: AgentState = useMemo(() => {
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

    switch (lifecycleState) {
      case 'listening':
      case 'thinking':
      case 'speaking':
        return {
          ...common,

          lifecycleState,
          ...generateDerivedLifecycleStateValues(lifecycleState),
          failureReasons: null,

          camera: videoTrack,
          microphone: audioTrack,
        };

      case 'unset':
      case 'initializing':
      case 'idle':
        return {
          ...common,

          lifecycleState,
          ...generateDerivedLifecycleStateValues(lifecycleState),
          failureReasons: null,

          // Clear inner values if no longer connected
          camera: null,
          microphone: null,
        };

      case 'failed':
        return {
          ...common,

          lifecycleState: 'failed',
          ...generateDerivedLifecycleStateValues('failed'),
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

    lifecycleState,
    videoTrack,
    audioTrack,
  ]);

  const waitUntilAvailable = useCallback(async (signal?: AbortSignal) => {
    const { isAvailable } = generateDerivedLifecycleStateValues(lifecycleState);
    if (isAvailable) {
      return;
    }

    return new Promise<void>((resolve, reject) => {
      const stateChangedHandler = (state: AgentLifecycleState) => {
        const { isAvailable } = generateDerivedLifecycleStateValues(state);
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
        emitter.off(AgentEvent.ConversationalStateChanged, stateChangedHandler);
        signal?.removeEventListener('abort', abortHandler);
      };

      emitter.on(AgentEvent.ConversationalStateChanged, stateChangedHandler);
      signal?.addEventListener('abort', abortHandler);
    });
  }, [lifecycleState, emitter]);

  const waitUntilCamera = useCallback((signal?: AbortSignal) => {
    return new Promise<TrackReference<Track.Source.Camera, RemoteParticipant>>((resolve, reject) => {
      const stateChangedHandler = (camera: TrackReference<Track.Source.Camera, RemoteParticipant> | null) => {
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
    return new Promise<TrackReference<Track.Source.Microphone, RemoteParticipant>>((resolve, reject) => {
      const stateChangedHandler = (microphone: TrackReference<Track.Source.Microphone, RemoteParticipant> | null) => {
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
