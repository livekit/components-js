/* eslint-disable camelcase */
import type { Participant, Room } from 'livekit-client';
import { RoomEvent } from 'livekit-client';
import { BehaviorSubject, Subject, scan, map, takeUntil } from 'rxjs';
import { DataTopic, sendMessage, setupDataMessageHandler } from '../observables/dataChannel';

/** @public */
export interface ChatMessage {
  id: string;
  timestamp: number;
  message: string;
}

/** @public */
export interface ReceivedChatMessage extends ChatMessage {
  from?: Participant;
  editTimestamp?: number;
}

/** @public */
export type MessageEncoder = (message: ChatMessage) => Uint8Array;
/** @public */
export type MessageDecoder = (message: Uint8Array) => ReceivedChatMessage;
/** @public */
export type ChatOptions = {
  messageEncoder?: (message: ChatMessage) => Uint8Array;
  messageDecoder?: (message: Uint8Array) => ReceivedChatMessage;
  channelTopic?: string;
  updateChannelTopic?: string;
};

type RawMessage = {
  payload: Uint8Array;
  topic: string | undefined;
  from: Participant | undefined;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const topicSubjectMap: Map<Room, Map<string, Subject<RawMessage>>> = new Map();

const encode = (message: ChatMessage) => encoder.encode(JSON.stringify(message));

const decode = (message: Uint8Array) => JSON.parse(decoder.decode(message)) as ReceivedChatMessage;

export function setupChat(room: Room, options?: ChatOptions) {
  const onDestroyObservable = new Subject<void>();

  const { messageDecoder, messageEncoder, channelTopic, updateChannelTopic } = options ?? {};

  const topic = channelTopic ?? DataTopic.CHAT;

  const updateTopic = updateChannelTopic ?? DataTopic.CHAT_UPDATE;

  let needsSetup = false;
  if (!topicSubjectMap.has(room)) {
    needsSetup = true;
  }
  const topicMap = topicSubjectMap.get(room) ?? new Map<string, Subject<RawMessage>>();
  const messageSubject = topicMap.get(topic) ?? new Subject<RawMessage>();
  topicMap.set(topic, messageSubject);
  topicSubjectMap.set(room, topicMap);

  if (needsSetup) {
    /** Subscribe to all appropriate messages sent over the wire. */
    const { messageObservable } = setupDataMessageHandler(room, [topic, updateTopic]);
    messageObservable.pipe(takeUntil(onDestroyObservable)).subscribe(messageSubject);
  }

  const finalMessageDecoder = messageDecoder ?? decode;

  /** Build up the message array over time. */
  const messagesObservable = messageSubject.pipe(
    map((msg) => {
      const parsedMessage = finalMessageDecoder(msg.payload);
      const newMessage: ReceivedChatMessage = { ...parsedMessage, from: msg.from };
      return newMessage;
    }),
    scan<ReceivedChatMessage, ReceivedChatMessage[]>((acc, value) => {
      // handle message updates
      if (
        'id' in value &&
        acc.find((msg) => msg.from?.identity === value.from?.identity && msg.id === value.id)
      ) {
        const replaceIndex = acc.findIndex((msg) => msg.id === value.id);
        if (replaceIndex > -1) {
          const originalMsg = acc[replaceIndex];
          acc[replaceIndex] = {
            ...value,
            timestamp: originalMsg.timestamp,
            editTimestamp: value.timestamp,
          };
        }

        return [...acc];
      }
      return [...acc, value];
    }, []),
    takeUntil(onDestroyObservable),
  );

  const isSending$ = new BehaviorSubject<boolean>(false);

  const finalMessageEncoder = messageEncoder ?? encode;

  const send = async (message: string) => {
    const timestamp = Date.now();
    const id = crypto.randomUUID();
    const chatMessage: ChatMessage = { id, message, timestamp };
    const encodedMsg = finalMessageEncoder(chatMessage);
    isSending$.next(true);
    try {
      await sendMessage(room.localParticipant, encodedMsg, {
        reliable: true,
        topic,
      });
      messageSubject.next({
        payload: encodedMsg,
        topic: topic,
        from: room.localParticipant,
      });
      return chatMessage;
    } finally {
      isSending$.next(false);
    }
  };

  const update = async (message: string, messageId: string) => {
    const timestamp = Date.now();
    const chatMessage: ChatMessage = { id: messageId, message, timestamp };
    const encodedMsg = finalMessageEncoder(chatMessage);
    isSending$.next(true);
    try {
      await sendMessage(room.localParticipant, encodedMsg, {
        topic: updateTopic,
        reliable: true,
      });
      messageSubject.next({
        payload: encodedMsg,
        topic: topic,
        from: room.localParticipant,
      });
      return chatMessage;
    } finally {
      isSending$.next(false);
    }
  };

  function destroy() {
    onDestroyObservable.next();
    onDestroyObservable.complete();
    topicSubjectMap.delete(room);
  }
  room.once(RoomEvent.Disconnected, destroy);

  return { messageObservable: messagesObservable, isSendingObservable: isSending$, send, update };
}
