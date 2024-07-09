import * as React from 'react';
import { ParticipantKind, Track } from 'livekit-client';
import type { RemoteParticipant } from 'livekit-client';
import type { ReceivedTranscriptionSegment, TrackReference } from '@livekit/components-core';
import { useRemoteParticipants } from './useRemoteParticipants';
import { useParticipantTracks } from './useParticipantTracks';
import { useTrackTranscription } from './useTrackTranscription';
import { useIsSpeaking } from './useIsSpeaking';
import { useParticipantInfo } from './useParticipantInfo';
import { useConnectionState } from './useConnectionStatus';

/**
 * @alpha
 */
export type VoiceAssistantState = 'offline' | 'connecting' | 'listening' | 'thinking' | 'speaking';

/**
 * @alpha
 */
export interface VoiceAssistant {
  agent: RemoteParticipant | undefined;
  state: VoiceAssistantState;
  audioTrack: TrackReference | undefined;
  agentTranscriptions: ReceivedTranscriptionSegment[];
}

/**
 * @alpha
 *
 * This hook looks for the first agent-participant in the room.
 * It assumes that the agent participant is based on the LiveKit VoiceAssistant API and
 * returns the most commonly used state vars when interacting with a VoiceAssistant.
 */
export function useVoiceAssistant(): VoiceAssistant {
  const agent = useRemoteParticipants().find((p) => p.kind === ParticipantKind.AGENT);
  const audioTrack = useParticipantTracks([Track.Source.Microphone], agent?.identity)[0];
  const { segments: agentTranscriptions } = useTrackTranscription(audioTrack);
  const isSpeaking = useIsSpeaking(agent);
  const { metadata: agentMetadata } = useParticipantInfo({ participant: agent });
  const connectionState = useConnectionState();

  const state: VoiceAssistantState = React.useMemo(() => {
    if (connectionState === 'disconnected') {
      return 'offline';
    } else if (connectionState !== 'connected') {
      return 'connecting';
    }

    if (!agent) {
      return 'connecting';
    }

    if (!agentMetadata) {
      return 'listening';
    }

    try {
      const { agent_state } = JSON.parse(agentMetadata);
      if (agent_state === 'thinking') {
        return 'thinking';
      } else if (agent_state === 'speaking' || isSpeaking) {
        return 'speaking';
      }
    } catch (e) {
      return 'listening';
    }
    return 'listening';
  }, [agentMetadata, agent, isSpeaking, connectionState]);

  return {
    agent,
    state,
    audioTrack,
    agentTranscriptions,
  };
}
