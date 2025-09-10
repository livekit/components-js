import { useMemo } from 'react';
// import type TypedEventEmitter from 'typed-emitter';
import { SendTextOptions } from 'livekit-client';
// import { EventEmitter } from "events";
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
import { ConversationInstance } from './useAgentConversation';

export type MessagesInstance = {
  [Symbol.toStringTag]: "MessagesInstance",

  messages: Array<ReceivedMessage>;

  /** Is a send operation currently in progress? */
  isSending: boolean;

  send: (message: string, options?: SendTextOptions) => Promise<ReceivedChatMessage>;

  // FIXME: does there need to be a way to subscribe to individual messages?
  // subtle: {
  //   emitter: TypedEventEmitter<MessagesCallbacks>;
  // };
}

export enum MessagesEvent {
  MessageReceived = 'messageReceived',
  Disconnected = 'disconnected',
}

export type MessagesCallbacks = {
  [MessagesEvent.MessageReceived]: (message: ReceivedMessage) => void;
  [MessagesEvent.Disconnected]: () => void;
};

export function useAgentMessages(conversation: ConversationInstance): MessagesInstance {
  const { room } = conversation.subtle;

  const agent = useAgent(conversation);

  const transcriptions: Array<TextStreamData> = useTranscriptions();
  const chat = useChat();

  const transcriptionMessages: Array<ReceivedUserTranscriptionMessage | ReceivedAgentTranscriptionMessage> = useMemo(() => {
    return transcriptions.map(transcription => {
      switch (transcription.participantInfo.identity) {
        case room.localParticipant.identity:
          return {
            type: 'userTranscript',
            message: transcription.text,

            id: transcription.streamInfo.id,
            timestamp: transcription.streamInfo.timestamp,
            from: room.localParticipant,
          };

        case agent.subtle.agentParticipant?.identity:
        case agent.subtle.workerParticipant?.identity:
          return {
            type: 'agentTranscript',
            message: transcription.text,

            id: transcription.streamInfo.id,
            timestamp: transcription.streamInfo.timestamp,
            from: agent.subtle.agentParticipant?.identity === transcription.participantInfo.identity ? (
              agent.subtle.agentParticipant
            ) : agent.subtle.workerParticipant!,
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
              (p) => p.identity === transcription.participantInfo.identity
            ),
          };
      }
    });
  }, [transcriptions, room]);

  const receivedMessages = useMemo(() => {
    const merged: Array<ReceivedMessage> = [
      ...transcriptionMessages,
      ...chat.chatMessages,
    ];
    return merged.sort((a, b) => a.timestamp - b.timestamp);
  }, [transcriptionMessages, chat.chatMessages]);

  return useMemo(() => ({
    [Symbol.toStringTag]: "MessagesInstance",

    messages: receivedMessages,
    send: chat.send,
    isSending: chat.isSending,
  }), [receivedMessages, chat.send, chat.isSending]);
}
