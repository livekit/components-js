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
  /**
   * The agent participant.
   */
  agent: RemoteParticipant | undefined;
  /**
   * The current state of the agent.
   */
  state: AgentState;
  /**
   * The microphone track published by the agent or associated avatar worker (if any).
   */
  audioTrack: TrackReference | undefined;
  /**
   * The camera track published by the agent or associated avatar worker (if any).
   */
  videoTrack: TrackReference | undefined;
  /**
   * The transcriptions of the agent's microphone track (if any).
   */
  agentTranscriptions: ReceivedTranscriptionSegment[];
  /**
   * The agent's participant attributes.
   */
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
  const remoteParticipants = useRemoteParticipants();
  const agent = remoteParticipants.find(
    (p) => p.kind === ParticipantKind.AGENT && !('lk.publish_on_behalf' in p.attributes),
  );
  const worker = remoteParticipants.find(
    (p) =>
      p.kind === ParticipantKind.AGENT && p.attributes['lk.publish_on_behalf'] === agent?.identity,
  );
  const agentTracks = useParticipantTracks(
    [Track.Source.Microphone, Track.Source.Camera],
    agent?.identity,
  );
  const workerTracks = useParticipantTracks(
    [Track.Source.Microphone, Track.Source.Camera],
    worker?.identity,
  );
  const audioTrack =
    agentTracks.find((t) => t.source === Track.Source.Microphone) ??
    workerTracks.find((t) => t.source === Track.Source.Microphone);
  const videoTrack =
    agentTracks.find((t) => t.source === Track.Source.Camera) ??
    workerTracks.find((t) => t.source === Track.Source.Camera);
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
