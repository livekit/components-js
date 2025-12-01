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

/** @private */
type ReceivedChatMessageWithRequiredType = ReceivedMessageWithType<
  'chatMessage',
  ChatMessage & {
    from?: Participant;
    attributes?: Record<string, string>;
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
  | ReceivedUserTranscriptionMessage
  | ReceivedAgentTranscriptionMessage
  | ReceivedChatMessage;
// TODO: images? attachments? rpc?
