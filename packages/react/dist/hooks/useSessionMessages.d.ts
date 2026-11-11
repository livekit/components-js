import { default as TypedEventEmitter } from 'typed-emitter';
import { SendTextOptions } from 'livekit-client';
import { ReceivedMessage, ReceivedChatMessage } from '@livekit/components-core';
import { UseSessionReturn } from './useSession';
/** @beta */
export type UseSessionMessagesReturn = {
    messages: Array<ReceivedMessage>;
    /** Is a send operation currently in progress? */
    isSending: boolean;
    send: (message: string, options?: SendTextOptions) => Promise<ReceivedChatMessage>;
    internal: {
        emitter: TypedEventEmitter<MessagesCallbacks>;
    };
};
/** @beta */
export declare enum MessagesEvent {
    /**
     * Emits when a new message is received from a participant
     * args: (message: ReceivedMessage)
     */
    MessageReceived = "messageReceived"
}
/** @beta */
export type MessagesCallbacks = {
    [MessagesEvent.MessageReceived]: (message: ReceivedMessage) => void;
};
/** @beta */
export declare function useSessionMessages(session?: UseSessionReturn): UseSessionMessagesReturn;
//# sourceMappingURL=useSessionMessages.d.ts.map