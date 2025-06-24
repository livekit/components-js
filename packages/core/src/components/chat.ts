/* eslint-disable camelcase */
import type { Participant, Room, ChatMessage, SendTextOptions } from 'livekit-client';
import { compareVersions, RoomEvent } from 'livekit-client';
import { BehaviorSubject, Subject, scan, map, takeUntil, from, filter } from 'rxjs';
import {
  DataTopic,
  LegacyDataTopic,
  sendMessage,
  setupDataMessageHandler,
} from '../observables/dataChannel';
import { log } from '../logger';

/** @public */
export type { ChatMessage };

/** @public */
export interface ReceivedChatMessage extends ChatMessage {
  from?: Participant;
}

export interface LegacyChatMessage extends ChatMessage {
  ignoreLegacy?: boolean;
}

export interface LegacyReceivedChatMessage extends ReceivedChatMessage {
  ignoreLegacy?: boolean;
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
  channelTopic?: string;
  /** @deprecated the new chat API doesn't rely on update topics anymore and uses a dedicated chat API instead */
  updateChannelTopic?: string;
};

const topicSubjectMap: WeakMap<Room, Map<string, Subject<ReceivedChatMessage>>> = new WeakMap();

function isIgnorableChatMessage(msg: ReceivedChatMessage | LegacyReceivedChatMessage) {
  return (msg as LegacyChatMessage).ignoreLegacy == true;
}

const decodeLegacyMsg = (message: Uint8Array) =>
  JSON.parse(new TextDecoder().decode(message)) as LegacyReceivedChatMessage | ReceivedChatMessage;

const encodeLegacyMsg = (message: LegacyChatMessage) =>
  new TextEncoder().encode(JSON.stringify(message));

export function setupChat(room: Room, options?: ChatOptions) {
  const serverSupportsDataStreams = () =>
    room.serverInfo?.edition === 1 ||
    (!!room.serverInfo?.version && compareVersions(room.serverInfo?.version, '1.8.2') > 0);

  const onDestroyObservable = new Subject<void>();

  const topic = options?.channelTopic ?? DataTopic.CHAT;
  const legacyTopic = options?.channelTopic ?? LegacyDataTopic.CHAT;

  let needsSetup = false;
  if (!topicSubjectMap.has(room)) {
    needsSetup = true;
  }
  const topicMap = topicSubjectMap.get(room) ?? new Map<string, Subject<ReceivedChatMessage>>();
  const messageSubject = topicMap.get(topic) ?? new Subject<ReceivedChatMessage>();
  topicMap.set(topic, messageSubject);
  topicSubjectMap.set(room, topicMap);

  const finalMessageDecoder = options?.messageDecoder ?? decodeLegacyMsg;
  if (needsSetup) {
    room.registerTextStreamHandler(topic, async (reader, participantInfo) => {
      const { id, timestamp } = reader.info;
      const streamObservable = from(reader).pipe(
        scan((acc: string, chunk: string) => {
          return acc + chunk;
        }),
        map((chunk: string) => {
          return {
            id,
            timestamp,
            message: chunk,
            from: room.getParticipantByIdentity(participantInfo.identity),
            // editTimestamp: type === 'update' ? timestamp : undefined,
          } as ReceivedChatMessage;
        }),
      );
      streamObservable.subscribe({
        next: (value) => messageSubject.next(value),
      });
    });

    /** legacy chat protocol handling */
    const { messageObservable } = setupDataMessageHandler(room, [legacyTopic]);
    messageObservable
      .pipe(
        map((msg) => {
          const parsedMessage = finalMessageDecoder(msg.payload);
          if (isIgnorableChatMessage(parsedMessage)) {
            return undefined;
          }
          const newMessage: ReceivedChatMessage = { ...parsedMessage, from: msg.from };
          return newMessage;
        }),
        filter((msg) => !!msg),
        takeUntil(onDestroyObservable),
      )
      .subscribe(messageSubject);
  }

  /** Build up the message array over time. */
  const messagesObservable = messageSubject.pipe(
    scan<ReceivedChatMessage, ReceivedChatMessage[]>((acc, value) => {
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
  const finalMessageEncoder = options?.messageEncoder ?? encodeLegacyMsg;

  const send = async (message: string, options?: SendTextOptions) => {
    if (!options) {
      options = {};
    }
    options.topic ??= topic;
    isSending$.next(true);

    try {
      const info = await room.localParticipant.sendText(message, options);

      const legacyChatMsg: LegacyChatMessage = {
        id: info.id,
        timestamp: Date.now(),
        message,
      };

      const chatMsg: ChatMessage = {
        ...legacyChatMsg,
        attachedFiles: options.attachments,
      };

      const receivedChatMsg: ReceivedChatMessage = {
        ...chatMsg,
        from: room.localParticipant,
      };

      messageSubject.next(receivedChatMsg);

      const encodedLegacyMsg = finalMessageEncoder({
        ...legacyChatMsg,
        ignoreLegacy: serverSupportsDataStreams(),
      });

      try {
        await sendMessage(room.localParticipant, encodedLegacyMsg, {
          reliable: true,
          topic: legacyTopic,
        });
      } catch (error) {
        log.info('could not send message in legacy chat format', error);
      }

      return receivedChatMsg;
    } finally {
      isSending$.next(false);
    }
  };

  function destroy() {
    onDestroyObservable.next();
    onDestroyObservable.complete();
    messageSubject.complete();
    topicSubjectMap.delete(room);
    room.unregisterTextStreamHandler(topic);
  }
  room.once(RoomEvent.Disconnected, destroy);

  return {
    messageObservable: messagesObservable,
    isSendingObservable: isSending$,
    send,
  };
}
