import { DataPacket_Kind, LocalParticipant, RemoteParticipant, Room } from 'livekit-client';
import { Observable, Subscriber } from 'rxjs';
import { createDataObserver } from './room';

export const DataTopic = {
  CHAT: 'lk-chat-topic',
} as const;

export type DataSendOptions = {
  kind?: DataPacket_Kind;
  destination?: string[];
};

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
  let dataSubscriber: Subscriber<BaseDataMessage<typeof topic> & { from?: RemoteParticipant }>;
  const messageObservable = new Observable<
    BaseDataMessage<typeof topic> & { from?: RemoteParticipant }
  >((subscriber) => {
    dataSubscriber = subscriber;
    const messageHandler = (
      messageTopic: string | undefined,
      payload: Uint8Array,
      participant?: RemoteParticipant,
    ) => {
      if (!topic || messageTopic === topic) {
        const receiveMessage = {
          payload,
          topic: topic,
          from: participant,
        };
        dataSubscriber.next(receiveMessage);
      }
    };
    const subscription = createDataObserver(room).subscribe(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ([payload, participant, _, messageTopic]) => {
        messageHandler(messageTopic, payload, participant);
      },
    );
    return () => subscription.unsubscribe();
  });

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
