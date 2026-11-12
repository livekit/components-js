/* eslint-disable camelcase */
import type { Room, SendTextOptions, TextStreamInfo } from 'livekit-client';
import { compareVersions, RoomEvent } from 'livekit-client';
import {
  BehaviorSubject,
  Subject,
  scan,
  map,
  takeUntil,
  from,
  filter,
  concatMap,
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
  /**
   * When passed to React's `useChat`, memoize this function with `useCallback` or define it
   * outside the component. A new function reference on each render recreates chat setup
   * and resets message history, which can cause a render loop.
   * @deprecated the new chat API doesn't rely on encoders and decoders anymore and uses a dedicated chat API instead
   */
  messageEncoder?: (message: LegacyChatMessage) => Uint8Array;
  /**
   * When passed to React's `useChat`, memoize this function with `useCallback` or define it
   * outside the component. A new function reference on each render recreates chat setup
   * and resets message history, which can cause a render loop.
   * @deprecated the new chat API doesn't rely on encoders and decoders anymore and uses a dedicated chat API instead
   */
  messageDecoder?: (message: Uint8Array) => LegacyReceivedChatMessage;
  channelTopic?: string;
  /** @deprecated the new chat API doesn't rely on update topics anymore and uses a dedicated chat API instead */
  updateChannelTopic?: string;
};

type ChatTopicState = {
  messageSubject: Subject<ReceivedChatMessage>;
  onDestroyObservable: Subject<void>;
  /** Messages sent from this client that haven't been sent successfully yet, kept for `resend`. */
  unsentMessages: Map<
    string,
    { message: ReceivedChatMessage; options: SendTextOptions; isSending: boolean }
  >;
};

let localMessageCount = 0;

/**
 * `sendText` only returns the stream id once sending finishes, so a message sent from this client
 * gets its own id up front and keeps it, whether it's sending, sent, or failed.
 */
function createLocalMessageId() {
  localMessageCount += 1;
  return `local-${Date.now().toString(36)}-${localMessageCount}`;
}

const topicSubjectMap: WeakMap<Room, Map<string, ChatTopicState>> = new WeakMap();
const streamIdToAttachments = new Map<
  string /* stream id */,
  Map<
    string /* attachment id */,
    Future<
      {
        fileName: string;
        mimeType: string;
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
    LegacyReceivedChatMessage | Exclude<ReceivedChatMessage, 'type'>;

const encodeLegacyMsg = (message: LegacyChatMessage) =>
  new TextEncoder().encode(JSON.stringify(message));

export function setupChat(room: Room, options?: ChatOptions) {
  const serverSupportsDataStreams = () =>
    room.serverInfo?.edition === 1 ||
    (!!room.serverInfo?.version && compareVersions(room.serverInfo?.version, '1.8.2') > 0);

  const topic = options?.channelTopic ?? DataTopic.CHAT;
  const legacyTopic = options?.channelTopic ?? LegacyDataTopic.CHAT;

  const isFirstTopicForRoom = !topicSubjectMap.has(room);
  const topicMap = topicSubjectMap.get(room) ?? new Map<string, ChatTopicState>();
  const needsSetup = !topicMap.has(topic);
  const topicState = topicMap.get(topic) ?? {
    messageSubject: new Subject<ReceivedChatMessage>(),
    onDestroyObservable: new Subject<void>(),
    unsentMessages: new Map(),
  };
  const { messageSubject, onDestroyObservable, unsentMessages } = topicState;
  topicMap.set(topic, topicState);
  topicSubjectMap.set(room, topicMap);

  if (isFirstTopicForRoom) {
    room.once(RoomEvent.Disconnected, () => {
      const topics = topicSubjectMap.get(room);
      topicSubjectMap.delete(room);
      topics?.forEach(({ messageSubject: subject, onDestroyObservable: onDestroy }, chatTopic) => {
        onDestroy.next();
        onDestroy.complete();
        subject.complete();
        room.unregisterTextStreamHandler(chatTopic);
        room.unregisterByteStreamHandler(chatTopic);
      });
    });
  }

  const finalMessageDecoder = options?.messageDecoder ?? decodeLegacyMsg;
  if (needsSetup) {
    room.registerTextStreamHandler(topic, async (reader, participantInfo) => {
      const { id, timestamp, attributes, attachedStreamIds } = reader.info;

      // Store a future for each attachment to be later resolved once the corresponding file data
      // stream completes.
      const attachments = new Map(
        (attachedStreamIds ?? []).map((id) => [
          id,
          new Future<{ fileName: string; mimeType: string; buffer: Array<Uint8Array> }, never>(),
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
              // `concatMap`, not `mergeMap`: `attachments` is built from `attachedStreamIds`, so it is
              // already in the sender's order, but `mergeMap` emits each promise as it RESOLVES — which
              // ordered `attachedFiles` by download completion (i.e. smallest file first). All the
              // promises are in flight either way; `concatMap` only sequences the emissions.
              concatMap((attachment) => from(attachment.promise)),
              scan(
                (acc, attachment) => [
                  ...acc,
                  // Preserve the MIME type: `new File(buffer, name)` leaves `File.type` empty, and
                  // consumers (including `ChatEntry`) test `file.type.startsWith('image/')`, which could
                  // never be true for a received attachment.
                  new File(attachment.buffer, attachment.fileName, { type: attachment.mimeType }),
                ],
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
        mimeType: reader.info.mimeType,
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
          // A status change on a message sent from this client isn't an edit
          acc[replaceIndex] = value.status
            ? value
            : {
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
  let pendingSends = 0;
  const finalMessageEncoder = options?.messageEncoder ?? encodeLegacyMsg;

  /**
   * Adds the message as `sending`, then marks it `sent` or `failed`. Rejects if sending fails,
   * leaving the failed message in place for `resend`.
   */
  const deliver = async (unsentMessage: ReceivedChatMessage, options: SendTextOptions) => {
    const { id, message } = unsentMessage;
    unsentMessages.set(id, { message: unsentMessage, options, isSending: true });
    pendingSends += 1;
    isSending$.next(true);
    messageSubject.next({ ...unsentMessage, status: 'sending' });

    try {
      let info: TextStreamInfo;
      try {
        info = await room.localParticipant.sendText(message, options);
      } catch (error) {
        unsentMessages.set(id, { message: unsentMessage, options, isSending: false });
        messageSubject.next({ ...unsentMessage, status: 'failed' });
        throw error;
      }

      unsentMessages.delete(id);
      const receivedChatMsg: ReceivedChatMessage = { ...unsentMessage, status: 'sent' };
      messageSubject.next(receivedChatMsg);

      const legacyChatMsg: LegacyChatMessage = {
        id: info.id,
        timestamp: unsentMessage.timestamp,
        message,
      };
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
      pendingSends -= 1;
      isSending$.next(pendingSends > 0);
    }
  };

  /** Sends a message. It appears in the messages right away with a `sending` status. */
  const send = async (message: string, options?: SendTextOptions) => {
    if (!options) {
      options = {};
    }
    options.topic ??= topic;

    return deliver(
      {
        id: createLocalMessageId(),
        timestamp: Date.now(),
        message,
        attachedFiles: options.attachments,
        type: 'chatMessage',
        from: room.localParticipant,
        attributes: options.attributes,
      },
      options,
    );
  };

  /** Sends a failed message again, keeping its id and place in the messages. */
  const resend = async (messageId: string) => {
    const unsent = unsentMessages.get(messageId);
    if (!unsent) {
      throw new Error(`No failed message with id ${messageId} to resend`);
    }
    if (unsent.isSending) {
      throw new Error(`Message ${messageId} is already sending`);
    }
    return deliver(unsent.message, unsent.options);
  };

  return {
    messageObservable: messagesObservable,
    isSendingObservable: isSending$,
    send,
    resend,
  };
}
