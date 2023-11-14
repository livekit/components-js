/* eslint-disable camelcase */
import type { Participant, Room } from 'livekit-client';
import { DataPacket_Kind } from 'livekit-client';
import { BehaviorSubject, Subject, scan, map, takeUntil } from 'rxjs';
import { DataTopic, sendMessage, setupDataMessageHandler } from '../observables/dataChannel';

/** @public */
export interface ChatMessage {
  timestamp: number;
  message: string;
}

/** @public */
export interface ReceivedChatMessage extends ChatMessage {
  from?: Participant;
}

/** @public */
export type MessageEncoder = (message: ChatMessage) => Uint8Array;
/** @public */
export type MessageDecoder = (message: Uint8Array) => ReceivedChatMessage;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const encode = (message: ChatMessage) =>
  encoder.encode(JSON.stringify({ message: message.message, timestamp: message.timestamp }));

const decode = (message: Uint8Array) => JSON.parse(decoder.decode(message)) as ReceivedChatMessage;

export function setupChat(
  room: Room,
  options?: {
    messageEncoder?: (message: ChatMessage) => Uint8Array;
    messageDecoder?: (message: Uint8Array) => ReceivedChatMessage;
  },
) {
  const onDestroyObservable = new Subject<void>();
  const messageSubject = new Subject<{
    payload: Uint8Array;
    topic: string | undefined;
    from: Participant | undefined;
  }>();

  /** Subscribe to all messages send over the wire. */
  const { messageObservable } = setupDataMessageHandler(room, DataTopic.CHAT);
  messageObservable.pipe(takeUntil(onDestroyObservable)).subscribe(messageSubject);

  const { messageDecoder, messageEncoder } = options ?? {};

  const finalMessageDecoder = messageDecoder ?? decode;

  /** Build up the message array over time. */
  const messagesObservable = messageSubject.pipe(
    map((msg) => {
      const parsedMessage = finalMessageDecoder(msg.payload);
      const newMessage: ReceivedChatMessage = { ...parsedMessage, from: msg.from };
      return newMessage;
    }),
    scan<ReceivedChatMessage, ReceivedChatMessage[]>((acc, value) => [...acc, value], []),
    takeUntil(onDestroyObservable),
  );

  const isSending$ = new BehaviorSubject<boolean>(false);

  const finalMessageEncoder = messageEncoder ?? encode;

  const send = async (message: string) => {
    const timestamp = Date.now();
    const encodedMsg = finalMessageEncoder({ message, timestamp });
    isSending$.next(true);
    try {
      await sendMessage(room.localParticipant, encodedMsg, DataTopic.CHAT, {
        kind: DataPacket_Kind.RELIABLE,
      });
      messageSubject.next({
        payload: encodedMsg,
        topic: DataTopic.CHAT,
        from: room.localParticipant,
      });
    } finally {
      isSending$.next(false);
    }
  };

  function destroy() {
    onDestroyObservable.next();
    onDestroyObservable.complete();
  }

  return { messageObservable: messagesObservable, isSendingObservable: isSending$, send, destroy };
}
