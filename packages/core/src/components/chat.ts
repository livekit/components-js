/* eslint-disable camelcase */
import type { Participant, Room, SendTextOptions } from 'livekit-client';
import { compareVersions, DataStreamError, DataStreamErrorReason, RoomEvent } from 'livekit-client';
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
};

const topicSubjectMap: WeakMap<Room, Map<string, ChatTopicState>> = new WeakMap();

/**
 * Settles an attachment whose byte stream never opened because its sender
 * left first. livekit-client raises nothing for a stream that never started,
 * so there is no SDK error to pass along.
 */
class AttachmentNotReceivedError extends Error {
  readonly participantIdentity: string;

  readonly attachmentStreamId: string;

  constructor(participantIdentity: string, attachmentStreamId: string) {
    super(
      `Participant ${participantIdentity} disconnected before sending attachment ${attachmentStreamId}`,
    );
    this.name = 'AttachmentNotReceivedError';
    this.participantIdentity = participantIdentity;
    this.attachmentStreamId = attachmentStreamId;
  }
}

const streamIdToAttachments = new Map<
  string /* stream id */,
  {
    room: Room;
    senderIdentity: string;
    attachments: Map<
      string /* attachment id */,
      Future<
        {
          fileName: string;
          mimeType: string;
          buffer: Array<Uint8Array>;
        },
        Error
      >
    >;
  }
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
  };
  const { messageSubject, onDestroyObservable } = topicState;
  topicMap.set(topic, topicState);
  topicSubjectMap.set(room, topicMap);

  if (isFirstTopicForRoom) {
    const handleParticipantDisconnected = (participant: Participant) => {
      for (const entry of streamIdToAttachments.values()) {
        // Identities are only unique within a room.
        if (entry.room !== room || entry.senderIdentity !== participant.identity) {
          continue;
        }
        for (const [attachmentStreamId, attachment] of entry.attachments) {
          // A byte stream that never opened has no controller livekit-client
          // could error - settle it here so the message pipeline reaches a
          // terminal state instead of hanging. Settled futures ignore this.
          attachment.reject?.(
            new AttachmentNotReceivedError(participant.identity, attachmentStreamId),
          );
        }
      }
    };
    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);

    room.once(RoomEvent.Disconnected, () => {
      room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
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
        (attachedStreamIds ?? []).map((id) => {
          const future = new Future<
            { fileName: string; mimeType: string; buffer: Array<Uint8Array> },
            Error
          >();
          // Ignore emitting `unhandledRejection` if the promise rejects before
          // the attachments `concatMap` switches to this promise.
          future.promise.catch(() => {});
          return [id, future] as const;
        }),
      );
      streamIdToAttachments.set(id, {
        room,
        senderIdentity: participantInfo.identity,
        attachments,
      });

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
        error: (error) => {
          // Keep a failed message (text stream errored, or an attachment
          // future rejected) from rethrowing globally as an uncaught
          // exception; `finalize` has already cleaned up its attachment state.
          // A disconnect mid-stream is expected churn; anything else deserves
          // a visible warning.
          const abnormalEnd =
            error instanceof AttachmentNotReceivedError ||
            (error instanceof DataStreamError &&
              error.reason === DataStreamErrorReason.AbnormalEnd);
          if (abnormalEnd) {
            log.debug('chat message stream ended abnormally', error);
          } else {
            log.warn('chat message stream failed', error);
          }
        },
      });
    });
    // NOTE: Attachment byte streams are guaranteed to arrive after their parent text stream
    // has initialized the attachment map (per client SDK sending implementation)
    room.registerByteStreamHandler(topic, async (reader) => {
      const { id: attachmentStreamId } = reader.info;
      const foundStreamAttachmentPair = Array.from(streamIdToAttachments).find(
        ([, entry]) => entry.room === room && entry.attachments.has(attachmentStreamId),
      );
      if (!foundStreamAttachmentPair) {
        return;
      }
      const streamId = foundStreamAttachmentPair[0];

      const bufferList = [];
      try {
        for await (const buffer of reader) {
          bufferList.push(buffer);
        }
      } catch (error) {
        // Settle the attachment future so the message pipeline errors instead
        // of hanging forever - its error callback logs and `finalize` cleans up
        // the attachment state. Without this the rejection is unhandled and the
        // pending future leaks its `streamIdToAttachments` entry.
        streamIdToAttachments
          .get(streamId)
          ?.attachments.get(attachmentStreamId)
          ?.reject?.(error instanceof Error ? error : new Error(String(error)));
        return;
      }

      const attachment = streamIdToAttachments.get(streamId)?.attachments.get(attachmentStreamId);
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

  return {
    messageObservable: messagesObservable,
    isSendingObservable: isSending$,
    send,
  };
}
