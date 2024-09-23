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
  image?: Blob;
  imagePacketProperties?: ImagePacketProperties;
}

export interface ImagePacketProperties {
  packetIndex: number;
  totalPacketCount: number;
  packetImageData: string;
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

const getImageBlob = (imagePackets: string[] | null[]) => {
  const completeImageData = imagePackets.join('');
  const byteCharacters = atob(completeImageData);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'image/jpeg' });
  return blob;
};

export function setupChat(room: Room, options?: ChatOptions) {
  const onDestroyObservable = new Subject<void>();

  const { messageDecoder, messageEncoder, channelTopic, updateChannelTopic } = options ?? {};

  // Used to map an image to its packets using id
  const chatImagesMap: { [key: string]: string[] | null[] } = {};

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
      // handle image messages
      if (value.imagePacketProperties) {
        const imageId = value.id;
        const totalPacketCount = value.imagePacketProperties.totalPacketCount;
        const packetIndex = value.imagePacketProperties.packetIndex;
        if (!chatImagesMap[imageId]) {
          chatImagesMap[imageId] = new Array(totalPacketCount).fill(null);
        }

        if (packetIndex >= 0 && packetIndex < totalPacketCount) {
          chatImagesMap[imageId][packetIndex] = value.imagePacketProperties.packetImageData;
        } else {
          console.error(
            `Index ${packetIndex} is out of bounds, Array size with size ${totalPacketCount}`,
          );
        }

        // received final image packet, can send a message with image to users
        if (packetIndex == totalPacketCount - 1) {
          const packets = chatImagesMap[imageId];
          if (packets != null && packets.every((element) => element !== null)) {
            const imageBlob = getImageBlob(packets);
            value.image = imageBlob;
            delete chatImagesMap[imageId];
            return [...acc, value];
          } else {
            console.error(`Didn't receive every image packet in order, discarding image message`);
            delete chatImagesMap[imageId];
            return [...acc];
          }
        } else {
          // ignore messages by not sending them to the user until final image packet arrives
          return [...acc];
        }
      } else {
        return [...acc, value];
      }
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

  const sendImagePacket = async (
    message: string,
    messageId: string,
    packetIndex: number,
    totalPacketCount: number,
    packetImageData: string,
  ) => {
    const timestamp = Date.now();
    const imageProp: ImagePacketProperties = {
      packetIndex: packetIndex,
      totalPacketCount: totalPacketCount,
      packetImageData: packetImageData,
    };
    const chatMessage: ChatMessage = {
      id: messageId,
      message,
      timestamp,
      imagePacketProperties: imageProp,
    };
    const encodedMsg = finalMessageEncoder(chatMessage);
    isSending$.next(true);
    try {
      await sendMessage(room.localParticipant, encodedMsg, {
        topic: topic,
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

  return {
    messageObservable: messagesObservable,
    isSendingObservable: isSending$,
    send,
    sendImagePacket,
    update,
  };
}
