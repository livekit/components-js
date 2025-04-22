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
  videoTrack: TrackReference | undefined;
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
  const agent = useRemoteParticipants().find(
    (p) => p.kind === ParticipantKind.AGENT && !('lk.publish_on_behalf' in p.attributes),
  );
  const worker = useRemoteParticipants().find(
    (p) =>
      p.kind === ParticipantKind.AGENT && p.attributes['lk.publish_on_behalf'] === agent?.identity,
  );
  const agentAudioTrack = useParticipantTracks([Track.Source.Microphone], agent?.identity)[0];
  const agentVideoTrack = useParticipantTracks([Track.Source.Camera], agent?.identity)[0];
  const workerAudioTrack = useParticipantTracks([Track.Source.Microphone], worker?.identity)[0];
  const workerVideoTrack = useParticipantTracks([Track.Source.Camera], worker?.identity)[0];
  const audioTrack = agentAudioTrack ?? workerAudioTrack;
  const videoTrack = agentVideoTrack ?? workerVideoTrack;
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
    videoTrack,
    agentTranscriptions,
    agentAttributes: attributes,
  };
}
