/* eslint-disable camelcase */
import { DataPacket_Kind, Participant, Room } from 'livekit-client';
import { BehaviorSubject, map, Observable, Subscriber } from 'rxjs';
import {
  BaseDataMessage,
  MessageType,
  sendMessage,
  setupDataMessageHandler,
} from '../observables/dataChannel';

export interface ChatDataMessage extends BaseDataMessage {
  type: MessageType.CHAT;
  payload: {
    timestamp: number;
    message: string;
  };
}

export interface ChatMessage {
  timestamp: number;
  message: string;
  from?: Participant;
}

export function setupChat(room: Room) {
  let chatMessages: Array<ChatMessage> = [];
  const { messageObservable } = setupDataMessageHandler<ChatDataMessage>(room, MessageType.CHAT);
  const chatMessageBehavior = new BehaviorSubject(chatMessages);
  const allMessagesObservable = messageObservable.pipe(
    map((msg) => {
      chatMessages = [...chatMessages, { ...msg.payload, from: msg.from }];
      return chatMessages;
    }),
  );
  // FIXME this potentially leads to a memory leak because the `unsubscribe` method of allMessagesObservable is never invoked
  allMessagesObservable.subscribe(chatMessageBehavior);

  let isSendingSubscriber: Subscriber<boolean>;
  const isSendingObservable = new Observable<boolean>((subscriber) => {
    isSendingSubscriber = subscriber;
  });

  const send = async (message: string) => {
    const timestamp = Date.now();
    const chatMsg: ChatDataMessage = {
      type: MessageType.CHAT,
      payload: {
        timestamp,
        message: message,
      },
    };
    isSendingSubscriber.next(true);
    try {
      await sendMessage<ChatDataMessage>(room.localParticipant, chatMsg, DataPacket_Kind.RELIABLE);
      chatMessages = [...chatMessages, { message, timestamp, from: room.localParticipant }];
      chatMessageBehavior.next(chatMessages);
    } finally {
      isSendingSubscriber.next(false);
    }
  };

  return { messageObservable: chatMessageBehavior.asObservable(), isSendingObservable, send };
}
