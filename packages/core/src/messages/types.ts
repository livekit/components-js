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

/** @public */
export type ReceivedChatMessage = ReceivedMessageWithType<
  'chatMessage',
  ChatMessage & {
    from?: Participant;
    attributes?: Record<string, string>;
  }
>;

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
