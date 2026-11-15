import type { Participant, ChatMessage } from 'livekit-client';
import type { TextStreamStatus } from '../components/textStream';

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
type ReceivedChatMessageStreaming = ReceivedChatMessageCommon & {
  status: TextStreamStatus.Streaming;
};

/** A message whose stream the sender closed cleanly. */
type ReceivedChatMessageComplete = ReceivedChatMessageCommon & {
  status: TextStreamStatus.Complete;
};

/**
 * A message whose stream read errored — most commonly when the sender disconnects
 * mid-stream. Whatever text and attachments arrived before the failure are kept.
 */
type ReceivedChatMessageFailed = ReceivedChatMessageCommon & {
  status: TextStreamStatus.Failed;
  error: Error;
};

/**
 * A message carrying no status, so code that builds or reads a
 * {@link ReceivedChatMessage} without touching `status` keeps type-checking.
 */
type ReceivedChatMessageLegacy = ReceivedChatMessageCommon & { status?: never };

/**
 * @public
 * A received chat message, discriminated by its `status` the same way
 * {@link TextStreamData} is: `streaming` while chunks arrive, `complete` once the
 * sender closes the stream cleanly, and `failed` (with the `error`) if the read
 * errors. Messages from before `status` existed carry none.
 */
export type ReceivedChatMessage =
  | ReceivedChatMessageStreaming
  | ReceivedChatMessageComplete
  | ReceivedChatMessageFailed
  | ReceivedChatMessageLegacy;

/**
 * The lifecycle of the transcription stream a transcript message came from: the
 * {@link TextStreamData} `status` (and `error`, once failed), carried through.
 * Transcripts built without a status carry none.
 */
type TranscriptionStatusFields =
  | { status: TextStreamStatus.Streaming }
  | { status: TextStreamStatus.Complete }
  | { status: TextStreamStatus.Failed; error: Error }
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
