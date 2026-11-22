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

/**
 * Where a received message is in its delivery: still arriving, whole, or cut off.
 * Independent of how the message is carried, so locally sent and legacy messages
 * (which are always whole) carry it too.
 * @public
 */
export enum ReceivedMessageStatus {
  /** The message is still arriving. */
  Streaming = 'streaming',
  /** The message arrived whole. */
  Complete = 'complete',
  /** Receiving the message failed, so its content may be incomplete. */
  Failed = 'failed',
}

/** Fields shared by every {@link ReceivedChatMessage} variant, regardless of status. */
type ReceivedChatMessageCommon = Omit<ReceivedChatMessageWithRequiredType, 'type'> & {
  type?: 'chatMessage';
};

/** A message still arriving. */
type ReceivedChatMessageStreaming = ReceivedChatMessageCommon & {
  status: ReceivedMessageStatus.Streaming;
};

/** A message that arrived whole. */
type ReceivedChatMessageComplete = ReceivedChatMessageCommon & {
  status: ReceivedMessageStatus.Complete;
};

/**
 * A message that failed to arrive whole — most commonly because the sender
 * disconnected partway through. Whatever text and attachments arrived before the
 * failure are kept.
 */
type ReceivedChatMessageFailed = ReceivedChatMessageCommon & {
  status: ReceivedMessageStatus.Failed;
  error: Error;
};

/**
 * A message carrying no status, so code that builds or reads a
 * {@link ReceivedChatMessage} without touching `status` keeps type-checking.
 */
type ReceivedChatMessageLegacy = ReceivedChatMessageCommon & { status?: never };

/**
 * @public
 * A received chat message, discriminated by its {@link ReceivedMessageStatus}:
 * `Streaming` while it arrives, `Complete` once it is whole, and `Failed` (with the
 * `error`) if receiving it failed. Messages built without a status carry none.
 */
export type ReceivedChatMessage =
  | ReceivedChatMessageStreaming
  | ReceivedChatMessageComplete
  | ReceivedChatMessageFailed
  | ReceivedChatMessageLegacy;

/**
 * A transcript message's {@link ReceivedMessageStatus} (and `error`, once failed).
 * Transcripts built without a status carry none.
 */
type TranscriptionStatusFields =
  | { status: ReceivedMessageStatus.Streaming }
  | { status: ReceivedMessageStatus.Complete }
  | { status: ReceivedMessageStatus.Failed; error: Error }
  | { status?: never };

export type ReceivedUserTranscriptionMessage = ReceivedMessageWithType<
  'userTranscript',
  {
    message: string;
  }
> &
  TranscriptionStatusFields;

export type ReceivedAgentTranscriptionMessage = ReceivedMessageWithType<
  'agentTranscript',
  {
    message: string;
  }
> &
  TranscriptionStatusFields;

/** @beta */
export type ReceivedMessage =
  ReceivedUserTranscriptionMessage | ReceivedAgentTranscriptionMessage | ReceivedChatMessage;
// TODO: images? attachments? rpc?
