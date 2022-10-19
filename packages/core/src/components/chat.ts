/* eslint-disable camelcase */
import { DataPacket_Kind, Participant, Room } from 'livekit-client';
import { Observable, Subscriber } from 'rxjs';
import { createDataObserver } from '../observables';
export const enum MessageType {
  CHAT,
}

export interface BaseDataMessage {
  type: MessageType;
}

export interface ChatDataMessage extends BaseDataMessage {
  type: MessageType.CHAT;
  timestamp: number;
  message: string;
}

type DataMessageUnion = ChatDataMessage;
export interface ChatMessage {
  timestamp: number;
  message: string;
  from?: Participant;
}

export function setupChat(room: Room) {
  let chatMessages: Array<ChatMessage> = [];
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let chatMessageSubscriber: Subscriber<ChatMessage[]>;
  const messageObservable = new Observable<ChatMessage[]>((subscriber) => {
    chatMessageSubscriber = subscriber;
    const subscription = createDataObserver(room).subscribe(([payload, participant]) => {
      const dataMsg = JSON.parse(decoder.decode(payload)) as DataMessageUnion;
      if (dataMsg.type === MessageType.CHAT) {
        const { timestamp, message } = dataMsg;
        chatMessages = [...chatMessages, { timestamp, message, from: participant }];
        subscriber.next(chatMessages);
      }
    });
    return () => subscription.unsubscribe();
  });

  let isSendingSubscriber: Subscriber<boolean>;
  const isSendingObservable = new Observable<boolean>((subscriber) => {
    isSendingSubscriber = subscriber;
  });

  const send = async (message: string) => {
    const timestamp = Date.now();
    const chatMsg: ChatDataMessage = {
      type: MessageType.CHAT,
      timestamp,
      message: message,
    };
    isSendingSubscriber.next(true);
    try {
      const dataMsg = encoder.encode(JSON.stringify(chatMsg));
      await room.localParticipant.publishData(dataMsg, DataPacket_Kind.RELIABLE);
      chatMessages = [...chatMessages, { message, timestamp, from: room.localParticipant }];
      chatMessageSubscriber.next(chatMessages);
    } finally {
      isSendingSubscriber.next(false);
    }
  };

  return { messageObservable, isSendingObservable, send };
}
