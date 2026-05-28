import { RemoteParticipant } from 'livekit-client';
import { ReceivedTranscriptionSegment, TrackReference } from '@livekit/components-core';
import { AgentState } from './useAgent';
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
/**
 * This hook looks for the first agent-participant in the room.
 * @remarks This hook requires an agent running with livekit-agents \>= 0.9.0
 * @example
 * ```tsx
 * const { state, audioTrack, agentTranscriptions, agentAttributes } = useVoiceAssistant();
 * ```
 * @beta
 */
export declare function useVoiceAssistant(): VoiceAssistant;
//# sourceMappingURL=useVoiceAssistant.d.ts.map