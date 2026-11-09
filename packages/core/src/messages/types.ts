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

/** Fields shared by every {@link ReceivedChatMessage} variant, regardless of status. */
type ReceivedChatMessageCommon = Omit<ReceivedChatMessageWithRequiredType, 'type'> & {
  type?: 'chatMessage';
};

/** A message still streaming in. */
type ReceivedChatMessagePending = ReceivedChatMessageCommon & { status: 'pending' };

/** A message whose stream the sender closed cleanly. */
type ReceivedChatMessageComplete = ReceivedChatMessageCommon & { status: 'complete' };

/**
 * A message whose stream read errored — most commonly when the sender disconnects
 * mid-stream. Whatever text and attachments arrived before the failure are kept.
 */
type ReceivedChatMessageFailed = ReceivedChatMessageCommon & { status: 'failed'; error: Error };

/**
 * A message carrying no status, so code that builds or reads a
 * {@link ReceivedChatMessage} without touching `status` keeps type-checking.
 */
type ReceivedChatMessageLegacy = ReceivedChatMessageCommon & { status?: never };

/**
 * @public
 * A received chat message, discriminated by its `status` the same way
 * {@link TextStreamData} is: `pending` while streaming, `complete` once the
 * sender closes the stream cleanly, and `failed` (with the `error`) if the read
 * errors. Messages from before `status` existed carry none.
 */
export type ReceivedChatMessage =
  | ReceivedChatMessagePending
  | ReceivedChatMessageComplete
  | ReceivedChatMessageFailed
  | ReceivedChatMessageLegacy;

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
