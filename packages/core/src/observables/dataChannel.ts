import {
  type ChatMessage,
  type DataPublishOptions,
  type LocalParticipant,
  type Participant,
  type Room,
  type SendTextOptions,
} from 'livekit-client';
import type { Subscriber } from 'rxjs';
import { Observable, filter, map } from 'rxjs';
import { createChatObserver, createDataObserver } from './room';
import { ReceivedChatMessage } from '../components/chat';

export const DataTopic = {
  CHAT: 'lk.chat',
  TRANSCRIPTION: 'lk.transcription',
} as const;

/** @deprecated */
export const LegacyDataTopic = {
  CHAT: 'lk-chat-topic',
} as const;

/** Publish data from the LocalParticipant. */
export async function sendMessage(
  localParticipant: LocalParticipant,
  payload: Uint8Array,
  options: DataPublishOptions = {},
) {
  const { reliable, destinationIdentities, topic } = options;

  await localParticipant.publishData(payload, {
    destinationIdentities,
    topic,
    reliable,
  });
}

export interface BaseDataMessage<T extends string | undefined> {
  topic?: T;
  payload: Uint8Array;
}

export interface ReceivedDataMessage<T extends string | undefined = string>
  extends BaseDataMessage<T> {
  from?: Participant;
}

export function setupDataMessageHandler<T extends string>(
  room: Room,
  topic?: T | [T, ...T[]],
  onMessage?: (msg: ReceivedDataMessage<T>) => void,
) {
  const topics = Array.isArray(topic) ? topic : [topic];
  /** Setup a Observable that returns all data messages belonging to a topic. */
  const messageObservable = createDataObserver(room).pipe(
    filter(
      ([, , , messageTopic]) =>
        topic === undefined || (messageTopic !== undefined && topics.includes(messageTopic as T)),
    ),
    map(([payload, participant, , messageTopic]) => {
      const msg = {
        payload,
        topic: messageTopic as T,
        from: participant,
      } satisfies ReceivedDataMessage<T>;
      onMessage?.(msg);
      return msg;
    }),
  );

  let isSendingSubscriber: Subscriber<boolean>;
  const isSendingObservable = new Observable<boolean>((subscriber) => {
    isSendingSubscriber = subscriber;
  });

  const send = async (payload: Uint8Array, options: DataPublishOptions = {}) => {
    isSendingSubscriber.next(true);
    try {
      await sendMessage(room.localParticipant, payload, { topic: topics[0], ...options });
    } finally {
      isSendingSubscriber.next(false);
    }
  };

  return { messageObservable, isSendingObservable, send };
}

export function setupChatMessageHandler(room: Room) {
  const chatObservable = createChatObserver(room);

  const send = async (text: string, options: SendTextOptions): Promise<ReceivedChatMessage> => {
    const msg = await room.localParticipant.sendChatMessage(text, options);
    await room.localParticipant.sendText(text, options);
    return {
      ...msg,
      type: 'chatMessage',
      from: room.localParticipant,
      attachedFiles: options.attachments,
    };
  };

  const edit = async (text: string, originalMsg: ChatMessage) => {
    const msg = await room.localParticipant.editChatMessage(text, originalMsg);
    return msg;
  };

  return { chatObservable, send, edit };
}
