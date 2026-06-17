import * as React from 'react';
import type TypedEventEmitter from 'typed-emitter';
import { SendTextOptions } from 'livekit-client';
import { EventEmitter } from 'events';
import {
  ReceivedMessage,
  ReceivedChatMessage,
  TextStreamData,
  ReceivedUserTranscriptionMessage,
  ReceivedAgentTranscriptionMessage,
} from '@livekit/components-core';

import { useAgent } from './useAgent';
import { useTranscriptions } from './useTranscriptions';
import { useChat } from './useChat';
import { UseSessionReturn } from './useSession';
import { useEnsureSession } from '../context';

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
export enum MessagesEvent {
  /**
   * Emits when a new message is received from a participant
   * args: (message: ReceivedMessage)
   */
  MessageReceived = 'messageReceived',
}

/** @beta */
export type MessagesCallbacks = {
  [MessagesEvent.MessageReceived]: (message: ReceivedMessage) => void;
};

/** @beta */
export function useSessionMessages(session?: UseSessionReturn): UseSessionMessagesReturn {
  const { room } = useEnsureSession(session);

  const emitter = React.useMemo(
    () => new EventEmitter() as TypedEventEmitter<MessagesCallbacks>,
    [],
  );

  const agent = useAgent(session);

  const transcriptions: Array<TextStreamData> = useTranscriptions({ room });
  const chatOptions = React.useMemo(() => ({ room }), [room]);
  const chat = useChat(chatOptions);

  const transcriptionMessages: Array<
    ReceivedUserTranscriptionMessage | ReceivedAgentTranscriptionMessage
  > = React.useMemo(() => {
    return transcriptions.map((transcription) => {
      switch (transcription.participantInfo.identity) {
        case room.localParticipant.identity:
          return {
            type: 'userTranscript',
            message: transcription.text,

            id: transcription.streamInfo.id,
            timestamp: transcription.streamInfo.timestamp,
            from: room.localParticipant,
          };

        case agent.internal.agentParticipant?.identity:
        case agent.internal.workerParticipant?.identity:
          return {
            type: 'agentTranscript',
            message: transcription.text,

            id: transcription.streamInfo.id,
            timestamp: transcription.streamInfo.timestamp,
            from:
              agent.internal.agentParticipant?.identity === transcription.participantInfo.identity
                ? agent.internal.agentParticipant
                : agent.internal.workerParticipant!,
          };

        default:
          // FIXME: what should happen if an associated participant is not found?
          //
          // For now, just assume it is an agent transcription, since maybe it is from an agent
          // which disconencted from the room or something like that.
          return {
            type: 'agentTranscript',
            message: transcription.text,

            id: transcription.streamInfo.id,
            timestamp: transcription.streamInfo.timestamp,
            from: Array.from(room.remoteParticipants.values()).find(
              (p) => p.identity === transcription.participantInfo.identity,
            ),
          };
      }
    });
  }, [transcriptions, room]);

  const receivedMessages = React.useMemo(() => {
    const merged: Array<ReceivedMessage> = [...transcriptionMessages, ...chat.chatMessages];
    return merged;
  }, [transcriptionMessages, chat.chatMessages]);

  // The time each transcription stream was first opened, captured in core before any text
  // streamed in (keyed by the transcription message id, which is the stream id).
  const transcriptionFirstReceivedTimes = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const transcription of transcriptions) {
      map.set(transcription.streamInfo.id, transcription.firstReceivedTime);
    }
    return map;
  }, [transcriptions]);

  // Sort by a single client clock rather than the embedded `timestamp` fields, which come from
  // different clocks for transcriptions (sender) and chat (local) and can drift relative to one
  // another. For transcriptions we use the stream-open time captured in core, so a transcript
  // whose text arrives late still orders by when speech began rather than when its text showed
  // up; chat messages have no such signal and fall back to their first-seen time.
  const messageFirstReceivedTimeMapRef = React.useRef(new Map<ReceivedMessage['id'], number>());
  const sortedReceivedMessages = React.useMemo(() => {
    const now = Date.now();
    for (const message of receivedMessages) {
      if (messageFirstReceivedTimeMapRef.current.has(message.id)) {
        continue;
      }

      messageFirstReceivedTimeMapRef.current.set(
        message.id,
        transcriptionFirstReceivedTimes.get(message.id) ?? now,
      );
    }

    return [...receivedMessages].sort((a, b) => {
      const aFirstReceivedAt = messageFirstReceivedTimeMapRef.current.get(a.id);
      const bFirstReceivedAt = messageFirstReceivedTimeMapRef.current.get(b.id);
      if (typeof aFirstReceivedAt === 'undefined' || typeof bFirstReceivedAt === 'undefined') {
        return 0;
      }

      return aFirstReceivedAt - bFirstReceivedAt;
    });
  }, [receivedMessages, transcriptionFirstReceivedTimes]);

  const previouslyReceivedMessageIdsRef = React.useRef(new Set());
  React.useEffect(() => {
    for (const message of sortedReceivedMessages) {
      if (previouslyReceivedMessageIdsRef.current.has(message.id)) {
        continue;
      }

      previouslyReceivedMessageIdsRef.current.add(message.id);
      emitter.emit(MessagesEvent.MessageReceived, message);
    }
  }, [sortedReceivedMessages]);

  return React.useMemo(
    () => ({
      messages: sortedReceivedMessages,
      send: chat.send,
      isSending: chat.isSending,
      internal: { emitter },
    }),
    [sortedReceivedMessages, chat.send, chat.isSending],
  );
}
