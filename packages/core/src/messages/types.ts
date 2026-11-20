import type { Participant, ChatMessage } from 'livekit-client';

/** @public */
export type { ChatMessage };

export type SentMessage = ChatMessage;

type ReceivedMessageWithType<Type extends string, Metadata extends object = object> = {
  id: string;
  timestamp: number;

  type: Type;

  from?: Participant;
  attributes?: Record<string, string>;
} & Metadata;

/**
 * Where a message sent from this client is in delivery. `sent` means the LiveKit server accepted
 * it, not that other participants have read it.
 * @public
 */
export type ChatMessageStatus = 'sending' | 'sent' | 'failed';

/** @private */
type ReceivedChatMessageWithRequiredType = ReceivedMessageWithType<
  'chatMessage',
  ChatMessage & {
    from?: Participant;
    attributes?: Record<string, string>;
    /** Set only on messages sent from this client. */
    status?: ChatMessageStatus;
  }
>;

/** @public */
export type ReceivedChatMessage = Omit<ReceivedChatMessageWithRequiredType, 'type'> & {
  type?: 'chatMessage';
};

export type ReceivedUserTranscriptionMessage = ReceivedMessageWithType<
  'userTranscript',
  {
    message: string;
  }
>;

export type ReceivedAgentTranscriptionMessage = ReceivedMessageWithType<
  'agentTranscript',
  {
    message: string;
  }
>;

/** @beta */
export type ReceivedMessage =
  ReceivedUserTranscriptionMessage | ReceivedAgentTranscriptionMessage | ReceivedChatMessage;
// TODO: images? attachments? rpc?
