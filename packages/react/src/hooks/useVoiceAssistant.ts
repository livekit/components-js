import * as React from 'react';
import { ConnectionState, ParticipantKind, Track } from 'livekit-client';
import type { RemoteParticipant } from 'livekit-client';
import type { ReceivedTranscriptionSegment, TrackReference } from '@livekit/components-core';
import { useRemoteParticipants } from './useRemoteParticipants';
import { useParticipantTracks } from './useParticipantTracks';
import { useTrackTranscription } from './useTrackTranscription';
import { useConnectionState } from './useConnectionStatus';
import { useParticipantAttributes } from './useParticipantAttributes';

/**
 * @beta
 */
export type AgentState =
  | 'disconnected'
  | 'connecting'
  | 'initializing'
  | 'listening'
  | 'thinking'
  | 'speaking';

/**
 * @beta
 */
export interface VoiceAssistant {
  agent: RemoteParticipant | undefined;
  state: AgentState;
  audioTrack: TrackReference | undefined;
  agentTranscriptions: ReceivedTranscriptionSegment[];
  agentAttributes: RemoteParticipant['attributes'] | undefined;
}

const state_attribute = 'lk.agent.state';

/**
 * This hook looks for the first agent-participant in the room.
 * @remarks This hook requires an agent running with livekit-agents \>= 0.9.0
 * @example
 * ```tsx
 * const { state, audioTrack, agentTranscriptions, agentAttributes } = useVoiceAssistant();
 * ```
 * @beta
 */
export function useVoiceAssistant(): VoiceAssistant {
  const agent = useRemoteParticipants().find((p) => p.kind === ParticipantKind.AGENT);
  const audioTrack = useParticipantTracks([Track.Source.Microphone], agent?.identity)[0];
  const { segments: agentTranscriptions } = useTrackTranscription(audioTrack);
  const connectionState = useConnectionState();
  const { attributes } = useParticipantAttributes({ participant: agent });

  const state: AgentState = React.useMemo(() => {
    if (connectionState === ConnectionState.Disconnected) {
      return 'disconnected';
    } else if (
      connectionState === ConnectionState.Connecting ||
      !agent ||
      !attributes?.[state_attribute]
    ) {
      return 'connecting';
    } else {
      return attributes[state_attribute] as AgentState;
    }
  }, [attributes, agent, connectionState]);

  return {
    agent,
    state,
    audioTrack,
    agentTranscriptions,
    agentAttributes: attributes,
  };
}
