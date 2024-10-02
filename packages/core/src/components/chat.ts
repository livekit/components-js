/* eslint-disable camelcase */
import type { Participant, Room, ChatMessage } from 'livekit-client';
import { compareVersions, RoomEvent } from 'livekit-client';
import { BehaviorSubject, Subject, scan, map, takeUntil, merge } from 'rxjs';
import {
  DataTopic,
  sendMessage,
  setupChatMessageHandler,
  setupDataMessageHandler,
} from '../observables/dataChannel';

/** @public */
export type { ChatMessage };

/** @public */
export interface ReceivedChatMessage extends ChatMessage {
  from?: Participant;
}

export interface LegacyChatMessage extends ChatMessage {
  ignore?: boolean;
}

export interface LegacyReceivedChatMessage extends ReceivedChatMessage {
  ignore?: boolean;
}

/**
 * @public
 * @deprecated the new chat API doesn't rely on encoders and decoders anymore and uses a dedicated chat API instead
 */
export type MessageEncoder = (message: LegacyChatMessage) => Uint8Array;
/**
 * @public
 * @deprecated the new chat API doesn't rely on encoders and decoders anymore and uses a dedicated chat API instead
 */
export type MessageDecoder = (message: Uint8Array) => LegacyReceivedChatMessage;
/** @public */
export type ChatOptions = {
  /** @deprecated the new chat API doesn't rely on encoders and decoders anymore and uses a dedicated chat API instead */
  messageEncoder?: (message: LegacyChatMessage) => Uint8Array;
  /** @deprecated the new chat API doesn't rely on encoders and decoders anymore and uses a dedicated chat API instead */
  messageDecoder?: (message: Uint8Array) => LegacyReceivedChatMessage;
  /** @deprecated the new chat API doesn't rely on topics anymore and uses a dedicated chat API instead */
  channelTopic?: string;
  /** @deprecated the new chat API doesn't rely on topics anymore and uses a dedicated chat API instead */
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

const encode = (message: LegacyReceivedChatMessage) => encoder.encode(JSON.stringify(message));

const decode = (message: Uint8Array) =>
  JSON.parse(decoder.decode(message)) as LegacyReceivedChatMessage | ReceivedChatMessage;

export function setupChat(room: Room, options?: ChatOptions) {
  const onDestroyObservable = new Subject<void>();

  const serverSupportsChatApi = () =>
    room.serverInfo?.edition === 1 ||
    (!!room.serverInfo?.version && compareVersions(room.serverInfo?.version, '1.17.2') > 0);

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
  const { chatObservable, send: sendChatMessage } = setupChatMessageHandler(room);

  const finalMessageDecoder = messageDecoder ?? decode;

  /** Build up the message array over time. */
  const messagesObservable = merge(
    messageSubject.pipe(
      map((msg) => {
        const parsedMessage = finalMessageDecoder(msg.payload);
        const newMessage = { ...parsedMessage, from: msg.from };
        if (isIgnorableChatMessage(newMessage)) {
          return undefined;
        }
        return newMessage;
      }),
    ),
    chatObservable.pipe(
      map(([msg, participant]) => {
        return { ...msg, from: participant };
      }),
    ),
  ).pipe(
    scan<ReceivedChatMessage | undefined, ReceivedChatMessage[]>((acc, value) => {
      // ignore legacy message updates
      if (!value) {
        return acc;
      }
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
            editTimestamp: value.editTimestamp ?? value.timestamp,
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
    isSending$.next(true);
    try {
      const chatMessage = await sendChatMessage(message);
      const encodedLegacyMsg = finalMessageEncoder({
        ...chatMessage,
        ignore: serverSupportsChatApi(),
      });
      await sendMessage(room.localParticipant, encodedLegacyMsg, {
        reliable: true,
        topic,
      });
      return chatMessage;
    } finally {
      isSending$.next(false);
    }
  };

  const update = async (message: string, originalMessageOrId: string | ChatMessage) => {
    const timestamp = Date.now();
    const originalMessage: ChatMessage =
      typeof originalMessageOrId === 'string'
        ? { id: originalMessageOrId, message: '', timestamp }
        : originalMessageOrId;
    isSending$.next(true);
    try {
      const editedMessage = await room.localParticipant.editChatMessage(message, originalMessage);
      const encodedLegacyMessage = finalMessageEncoder(editedMessage);
      await sendMessage(room.localParticipant, encodedLegacyMessage, {
        topic: updateTopic,
        reliable: true,
      });
      return editedMessage;
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
    update,
  };
}

function isIgnorableChatMessage(
  msg: ReceivedChatMessage | LegacyReceivedChatMessage,
): msg is ReceivedChatMessage {
  return (msg as LegacyChatMessage).ignore == true;
}
