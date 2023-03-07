/* eslint-disable camelcase */
import { DataPacket_Kind, LocalParticipant, RemoteParticipant, Room } from 'livekit-client';
import { BehaviorSubject, map, Observable, Subscriber } from 'rxjs';
import { DataTopic, sendMessage, setupDataMessageHandler } from '../observables/dataChannel';

export interface ChatMessage {
  timestamp: number;
  message: string;
}

export interface ReceivedChatMessage extends ChatMessage {
  from?: RemoteParticipant | LocalParticipant;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function setupChat(room: Room) {
  let chatMessages: ReceivedChatMessage[] = [];
  const { messageObservable } = setupDataMessageHandler(room, DataTopic.CHAT);
  const chatMessageBehavior = new BehaviorSubject(chatMessages);
  const allMessagesObservable = messageObservable.pipe(
    map((msg) => {
      const parsedMessage = JSON.parse(decoder.decode(msg.payload)) as ChatMessage;
      chatMessages = [...chatMessages, { ...parsedMessage, from: msg.from }];
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
    const encodedMsg = encoder.encode(JSON.stringify({ timestamp, message }));
    isSendingSubscriber.next(true);
    try {
      await sendMessage(room.localParticipant, encodedMsg, DataTopic.CHAT, {
        kind: DataPacket_Kind.RELIABLE,
      });
      chatMessages = [...chatMessages, { message, timestamp, from: room.localParticipant }];
      chatMessageBehavior.next(chatMessages);
    } finally {
      isSendingSubscriber.next(false);
    }
  };

  return { messageObservable: chatMessageBehavior.asObservable(), isSendingObservable, send };
}
