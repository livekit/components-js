import type { Participant, ChatMessage } from 'livekit-client';
import { TextStreamInfo } from 'livekit-client/dist/src/room/types';

/** @public */
export type { ChatMessage };

export type SentMessage = ChatMessage;

type ReceivedMessageWithType<
  Type extends string,
  Metadata extends {} = {},
> = {
  id: string;
  timestamp: number;

  type: Type;

  from?: Participant;
  attributes?: Record<string, string>;
} & Metadata;

/** @public */
export type ReceivedChatMessage = ReceivedMessageWithType<'chatMessage', ChatMessage & {
  from?: Participant;
  attributes?: Record<string, string>;
}>;

export type ReceivedAgentTranscriptionMessage = ReceivedMessageWithType<'agentTranscript', {
  message: string;
  streamInfo: TextStreamInfo;
}>;

export type ReceivedUserTranscriptionMessage = ReceivedMessageWithType<'userTranscript', {
  message: string;
  streamInfo: TextStreamInfo;
}>;

export type ReceivedUserInputMessage = ReceivedMessageWithType<'userInput'>;

/** @public */
export type ReceivedMessage =
  | ReceivedUserTranscriptionMessage
  | ReceivedAgentTranscriptionMessage
  | ReceivedUserInputMessage
  // TODO: images? attachments? rpc?
