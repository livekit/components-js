import type { DataPublishOptions, LocalParticipant, Participant, Room } from 'livekit-client';
import type { Subscriber } from 'rxjs';
import { Observable, filter, map } from 'rxjs';
import { createDataObserver } from './room';

export const DataTopic = {
  CHAT: 'lk-chat-topic',
} as const;

/** Publish data from the LocalParticipant. */
export async function sendMessage(
  localParticipant: LocalParticipant,
  payload: Uint8Array,
  topic?: string,
  options: DataPublishOptions = {},
) {
  const { reliable, destination } = options;

  await localParticipant.publishData(payload, {
    destination,
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
  topic?: T,
  onMessage?: (msg: ReceivedDataMessage<T>) => void,
) {
  /** Setup a Observable that returns all data messages belonging to a topic. */
  const messageObservable = createDataObserver(room).pipe(
    filter(([, , , messageTopic]) => topic === undefined || messageTopic === topic),
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
      await sendMessage(room.localParticipant, payload, topic, options);
    } finally {
      isSendingSubscriber.next(false);
    }
  };

  return { messageObservable, isSendingObservable, send };
}
