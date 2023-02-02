import { DataPacket_Kind, LocalParticipant, RemoteParticipant, Room } from 'livekit-client';
import { Observable, Subscriber } from 'rxjs';
import { createDataObserver } from './room';

export const enum MessageChannel {
  CHAT = 'lk-chat-message',
}

/**
 * Creates a hash used to differentiate data message types.
 * Identifiers starting with `lk-` are reserved for internal use.
 * @param identifier - message identifier, e.g. "my-data-message"
 * @returns
 */
export function getRawMessageType(identifier: string) {
  const hash = hashCode(identifier);
  const rawType = new Uint8Array(toBytesInt32(hash));
  return rawType;
}

/**
 * Returns a hash code from a string
 * @param str - The string to hash.
 * @see http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
 */
function hashCode(str: string) {
  let hash = 0;
  for (let i = 0, len = str.length; i < len; i++) {
    const chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

const TYPE_BYTE_LENGTH = 4;

function toBytesInt32(num: number) {
  const arr = new ArrayBuffer(4); // an Int32 takes 4 bytes
  const view = new DataView(arr);
  view.setUint32(0, num, false); // byteOffset = 0; litteEndian = false
  return arr;
}

export function extractRawMessage(rawData: Uint8Array) {
  return [readMessageType(rawData), readMessagePayload(rawData)] as const;
}

function readMessageType(rawData: Uint8Array) {
  return rawData.slice(0, TYPE_BYTE_LENGTH);
}

export function readMessagePayload(rawData: Uint8Array) {
  return rawData.slice(TYPE_BYTE_LENGTH);
}

function areEqual(first: Uint8Array, second: Uint8Array) {
  return first.length === second.length && first.every((value, index) => value === second[index]);
}

export function isMessageType(identifier: string, data: Uint8Array) {
  return areEqual(readMessageType(data), getRawMessageType(identifier));
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

enum PayloadType {
  RAW,
  STRING,
  OBJECT,
}

export async function sendMessage<T extends BaseDataMessage>(
  localParticipant: LocalParticipant,
  message: T,
  kind: DataPacket_Kind,
  destination?: string[],
) {
  const rawType = getRawMessageType(message.channelId);
  const payload = message.payload;
  let payloadType: PayloadType;
  let encodedPayload: Uint8Array;
  if (payload instanceof Uint8Array) {
    encodedPayload = payload;
    payloadType = PayloadType.RAW;
  } else if (typeof payload === 'string') {
    encodedPayload = encoder.encode(payload);
    payloadType = PayloadType.STRING;
  } else {
    encodedPayload = encoder.encode(JSON.stringify(payload));
    payloadType = PayloadType.OBJECT;
  }
  const msg = new Uint8Array(rawType.length + encodedPayload.length + 1);
  msg.set(rawType);
  msg.set([payloadType], rawType.length);
  msg.set(encodedPayload, rawType.length + 1);
  await localParticipant.publishData(msg, kind, destination);
}

export function parseMessage(payload: Uint8Array) {
  const payloadType = payload.slice(0, 1)[0] as PayloadType;
  const content = payload.slice(1);
  let msg: DataPayload;
  if (payloadType === PayloadType.RAW) {
    msg = content;
  } else if (payloadType === PayloadType.STRING) {
    msg = decoder.decode(content);
  } else {
    msg = JSON.parse(decoder.decode(content));
  }
  return msg;
}

export type DataPayload = Uint8Array | object | string;

export interface BaseDataMessage {
  channelId: string;
  payload: DataPayload;
}

export function setupDataMessageHandler<T extends BaseDataMessage>(
  room: Room,
  channelId: T['channelId'],
) {
  let dataSubscriber: Subscriber<T & { from?: RemoteParticipant }>;
  const messageObservable = new Observable<T & { from?: RemoteParticipant }>((subscriber) => {
    dataSubscriber = subscriber;
    const messageHandler = (
      type: T['channelId'],
      payload: Uint8Array,
      participant?: RemoteParticipant,
    ) => {
      if (isMessageType(type, payload)) {
        const dataMsg = parseMessage(readMessagePayload(payload)) as T['payload'];
        const receiveMessage = {
          payload: dataMsg,
          channelId: channelId,
          from: participant,
        } as T & { from?: RemoteParticipant };
        dataSubscriber.next(receiveMessage);
      }
    };
    const subscription = createDataObserver(room).subscribe(([payload, participant]) => {
      messageHandler(channelId, payload, participant);
    });
    return () => subscription.unsubscribe();
  });

  let isSendingSubscriber: Subscriber<boolean>;
  const isSendingObservable = new Observable<boolean>((subscriber) => {
    isSendingSubscriber = subscriber;
  });

  const send = async (payload: T['payload'], kind = DataPacket_Kind.LOSSY) => {
    isSendingSubscriber.next(true);
    try {
      await sendMessage(
        room.localParticipant,
        { channelId, payload },
        kind ?? DataPacket_Kind.RELIABLE,
      );
    } finally {
      isSendingSubscriber.next(false);
    }
  };

  return { messageObservable, isSendingObservable, send };
}
