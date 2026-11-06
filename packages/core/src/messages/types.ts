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
 * The sender of a message, as a first-class discriminated field rather than a stringly-typed attribute.
 * `origin` is the discriminator (`user` / `agent`) and `role` is the matching chat role, locked to it.
 * The third branch (`origin?: never`) keeps messages that predate this field assignable, so adding it is
 * backwards compatible.
 * @public
 */
export type MessageSender =
  | { origin: 'user'; role: 'user' }
  | { origin: 'agent'; role: 'assistant' }
  | { origin?: never; role?: never };

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
} & MessageSender;

export type ReceivedUserTranscriptionMessage = ReceivedMessageWithType<
  'userTranscript',
  {
    message: string;
  }
> &
  MessageSender;

export type ReceivedAgentTranscriptionMessage = ReceivedMessageWithType<
  'agentTranscript',
  {
    message: string;
  }
> &
  MessageSender;

/** @beta */
export type ReceivedMessage =
  ReceivedUserTranscriptionMessage | ReceivedAgentTranscriptionMessage | ReceivedChatMessage;
// TODO: images? attachments? rpc?
