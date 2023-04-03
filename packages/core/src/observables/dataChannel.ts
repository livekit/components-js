import type { LocalParticipant, Room } from 'livekit-client';
import { DataPacket_Kind } from 'livekit-client';
import type { Subscriber } from 'rxjs';
import { Observable, filter, map } from 'rxjs';
import { createDataObserver } from './room';

export const DataTopic = {
  CHAT: 'lk-chat-topic',
} as const;

export type DataSendOptions = {
  kind?: DataPacket_Kind;
  destination?: string[];
};

/** Publish data from the LocalParticipant. */
export async function sendMessage(
  localParticipant: LocalParticipant,
  payload: Uint8Array,
  topic?: string,
  options: DataSendOptions = {},
) {
  const { kind, destination } = options;

  await localParticipant.publishData(payload, kind ?? DataPacket_Kind.RELIABLE, {
    destination,
    topic,
  });
}

export interface BaseDataMessage<T extends string | undefined> {
  topic?: T;
  payload: Uint8Array;
}

export function setupDataMessageHandler<T extends string>(room: Room, topic?: T) {
  /** Setup a Observable that returns all data messages belonging to a topic. */
  const messageObservable = createDataObserver(room).pipe(
    filter(([, , , messageTopic]) => messageTopic === undefined || messageTopic === topic),
    map(([payload, participant, , messageTopic]) => {
      return {
        payload,
        topic: messageTopic,
        from: participant,
      };
    }),
  );

  let isSendingSubscriber: Subscriber<boolean>;
  const isSendingObservable = new Observable<boolean>((subscriber) => {
    isSendingSubscriber = subscriber;
  });

  const send = async (payload: Uint8Array, options: DataSendOptions = {}) => {
    isSendingSubscriber.next(true);
    try {
      await sendMessage(room.localParticipant, payload, topic, options);
    } finally {
      isSendingSubscriber.next(false);
    }
  };

  return { messageObservable, isSendingObservable, send };
}
