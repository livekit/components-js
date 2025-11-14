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

  const messageFirstReceivedTimeMapRef = React.useRef(new Map<ReceivedMessage['id'], Date>());
  const sortedReceivedMessages = React.useMemo(() => {
    const now = new Date();
    for (const message of receivedMessages) {
      if (messageFirstReceivedTimeMapRef.current.has(message.id)) {
        continue;
      }

      messageFirstReceivedTimeMapRef.current.set(message.id, now);
    }

    return receivedMessages.sort((a, b) => {
      const aFirstReceivedAt = messageFirstReceivedTimeMapRef.current.get(a.id);
      const bFirstReceivedAt = messageFirstReceivedTimeMapRef.current.get(b.id);
      if (typeof aFirstReceivedAt === 'undefined' || typeof bFirstReceivedAt === 'undefined') {
        return 0;
      }

      return aFirstReceivedAt.getTime() - bFirstReceivedAt.getTime();
    });
  }, [receivedMessages]);

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
