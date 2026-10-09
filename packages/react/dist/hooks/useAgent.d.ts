import { RemoteParticipant, Participant } from 'livekit-client';
import { default as TypedEventEmitter } from 'typed-emitter';
import { TrackReference } from '@livekit/components-core';
import { UseSessionReturn } from './useSession';
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
export type AgentState = 'disconnected' | 'connecting' | 'pre-connect-buffering' | 'failed' | AgentSdkStates;
/** @beta */
export declare enum AgentEvent {
    CameraChanged = "cameraChanged",
    MicrophoneChanged = "microphoneChanged",
    StateChanged = "stateChanged"
}
/** @beta */
export type AgentCallbacks = {
    [AgentEvent.CameraChanged]: (newTrack: TrackReference | undefined) => void;
    [AgentEvent.MicrophoneChanged]: (newTrack: TrackReference | undefined) => void;
    [AgentEvent.StateChanged]: (newAgentState: AgentState) => void;
};
type AgentStateCommon = {
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
type AgentStateCases = AgentStateConnecting | AgentStateDisconnected | AgentStateAvailable | AgentStatePreConnectBuffering | AgentStateUnAvailable | AgentStateFailed;
/** @beta */
export type UseAgentReturn = AgentStateCases & AgentActions;
/** Internal hook used by useSession to store global agent state */
export declare const useAgentTimeoutIdStore: () => {
    agentTimeoutFailureReason: string | null;
    startAgentTimeout: (agentConnectTimeoutMilliseconds?: number) => void;
    clearAgentTimeout: () => void;
    clearAgentTimeoutFailureReason: () => void;
    updateAgentTimeoutState: (agentState: AgentState) => void;
    updateAgentTimeoutParticipantExists: (agentParticipantExists: boolean) => void;
};
type SessionStub = Pick<UseSessionReturn, 'connectionState' | 'room' | 'internal'>;
/**
 * useAgent encapculates all agent state, normalizing some quirks around how LiveKit Agents work.
 * @beta
 */
export declare function useAgent(session?: SessionStub): UseAgentReturn;
export {};
//# sourceMappingURL=useAgent.d.ts.map