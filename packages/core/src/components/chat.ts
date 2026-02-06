/* eslint-disable camelcase */
import type { Room, SendTextOptions } from 'livekit-client';
import { compareVersions, RoomEvent } from 'livekit-client';
import {
  BehaviorSubject,
  Subject,
  scan,
  map,
  takeUntil,
  from,
  filter,
  mergeMap,
  finalize,
  of,
} from 'rxjs';
import {
  DataTopic,
  LegacyDataTopic,
  sendMessage,
  setupDataMessageHandler,
} from '../observables/dataChannel';
import { log } from '../logger';
import { ChatMessage, ReceivedChatMessage } from '../messages/types';
import { Future } from '../helper/future';

/** @public */
export type { ChatMessage, ReceivedChatMessage };

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
const streamIdToAttachments = new Map<
  string /* stream id */,
  Map<
    string /* attachment id */,
    Future<
      {
        fileName: string;
        buffer: Array<Uint8Array>;
      },
      never
    >
  >
>();

function isIgnorableChatMessage(msg: ReceivedChatMessage | LegacyReceivedChatMessage) {
  return (msg as LegacyChatMessage).ignoreLegacy == true;
}

const decodeLegacyMsg = (message: Uint8Array) =>
  JSON.parse(new TextDecoder().decode(message)) as
    | LegacyReceivedChatMessage
    | Exclude<ReceivedChatMessage, 'type'>;

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
      const { id, timestamp, attributes, attachedStreamIds } = reader.info;

      // Store a future for each attachment to be later resolved once the corresponding file data
      // stream completes.
      const attachments = new Map(
        (attachedStreamIds ?? []).map((id) => [
          id,
          new Future<{ fileName: string; buffer: Array<Uint8Array> }, never>(),
        ]),
      );
      streamIdToAttachments.set(id, attachments);

      const streamObservable = from(reader).pipe(
        scan((acc: string, chunk: string) => {
          return acc + chunk;
        }),
        mergeMap((chunk: string) => {
          if (attachments.size === 0) {
            return of({ chunk, attachedFiles: [] });
          } else {
            // Aggregate all attachments into memory and transform them into a list of files
            return from(attachments.values()).pipe(
              mergeMap((attachment) => from(attachment.promise)),
              scan(
                (acc, attachment) => [...acc, new File(attachment.buffer, attachment.fileName)],
                [] as Array<File>,
              ),
              map((attachedFiles) => ({ chunk, attachedFiles })),
            );
          }
        }),
        map(({ chunk, attachedFiles }) => {
          return {
            id,
            timestamp,
            message: chunk,
            from: room.getParticipantByIdentity(participantInfo.identity),
            type: 'chatMessage',
            attributes,
            attachedFiles,
            // editTimestamp: type === 'update' ? timestamp : undefined,
          } satisfies ReceivedChatMessage;
        }),
        finalize(() => streamIdToAttachments.delete(id)),
      );
      streamObservable.subscribe({
        next: (value) => messageSubject.next(value),
      });
    });
    // NOTE: Attachment byte streams are guaranteed to arrive after their parent text stream
    // has initialized the attachment map (per client SDK sending implementation)
    room.registerByteStreamHandler(topic, async (reader) => {
      const { id: attachmentStreamId } = reader.info;
      const foundStreamAttachmentPair = Array.from(streamIdToAttachments).find(([, attachments]) =>
        attachments.has(attachmentStreamId),
      );
      if (!foundStreamAttachmentPair) {
        return;
      }
      const streamId = foundStreamAttachmentPair[0];

      const bufferList = [];
      for await (const buffer of reader) {
        bufferList.push(buffer);
      }

      const attachment = streamIdToAttachments.get(streamId)?.get(attachmentStreamId);
      if (!attachment) {
        return;
      }

      attachment.resolve?.({
        fileName: reader.info.name,
        buffer: bufferList,
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
          const newMessage: ReceivedChatMessage = {
            ...parsedMessage,
            type: 'chatMessage',
            from: msg.from,
          };
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
        type: 'chatMessage',
        from: room.localParticipant,
        attributes: options.attributes,
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
    room.unregisterByteStreamHandler(topic);
  }
  room.once(RoomEvent.Disconnected, destroy);

  return {
    messageObservable: messagesObservable,
    isSendingObservable: isSending$,
    send,
  };
}
