/* eslint-disable camelcase */
import { DataPacket_Kind, LocalParticipant, RemoteParticipant, Room } from 'livekit-client';
import { merge, Observable } from 'zen-observable/esm';
import {
  BaseDataMessage,
  MessageChannel,
  sendMessage,
  setupDataMessageHandler,
} from '../observables/dataChannel';
import { observableWithTrigger } from '../observables/utils';

export interface ChatDataMessage extends BaseDataMessage {
  channelId: MessageChannel.CHAT;
  payload: ChatMessage;
}

export interface ChatMessage {
  timestamp: number;
  message: string;
}

export function setupChat(room: Room) {
  let chatMessages: Array<ChatMessage & { from?: RemoteParticipant | LocalParticipant }> = [];
  const { messageObservable } = setupDataMessageHandler<ChatDataMessage>(room, MessageChannel.CHAT);
  const { trigger: messageTrigger, observable } = observableWithTrigger(chatMessages);
  const allMessagesObservable = merge(
    messageObservable.map((msg) => {
      chatMessages = [...chatMessages, { ...msg.payload, from: msg.from }];
      return chatMessages;
    }),
    observable,
  );

  let isSendingSubscriber: ZenObservable.SubscriptionObserver<boolean>;
  const isSendingObservable = new Observable<boolean>((subscriber) => {
    isSendingSubscriber = subscriber;
  });

  const send = async (message: string) => {
    const timestamp = Date.now();
    const chatMsg: ChatDataMessage = {
      channelId: MessageChannel.CHAT,
      payload: {
        timestamp,
        message: message,
      },
    };
    isSendingSubscriber.next(true);
    try {
      await sendMessage<ChatDataMessage>(room.localParticipant, chatMsg, DataPacket_Kind.RELIABLE);
      chatMessages = [...chatMessages, { message, timestamp, from: room.localParticipant }];
      messageTrigger.next(chatMessages);
    } finally {
      isSendingSubscriber.next(false);
    }
  };

  return { messageObservable: allMessagesObservable, isSendingObservable, send };
}
