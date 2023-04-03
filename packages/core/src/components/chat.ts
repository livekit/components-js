/* eslint-disable camelcase */
import type { Participant, Room } from 'livekit-client';
import { DataPacket_Kind } from 'livekit-client';
import { BehaviorSubject, Subject, scan, map, takeUntil } from 'rxjs';
import { DataTopic, sendMessage, setupDataMessageHandler } from '../observables/dataChannel';

export interface ChatMessage {
  timestamp: number;
  message: string;
}

export interface ReceivedChatMessage extends ChatMessage {
  from?: Participant;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function setupChat(room: Room) {
  const onDestroyObservable = new Subject<void>();
  const messageSubject = new Subject<{
    payload: Uint8Array;
    topic: string | undefined;
    from: Participant | undefined;
  }>();

  /** Subscribe to all messages send over the wire. */
  const { messageObservable } = setupDataMessageHandler(room, DataTopic.CHAT);
  messageObservable.pipe(takeUntil(onDestroyObservable)).subscribe(messageSubject);

  /** Build up the message array over time. */
  const messagesObservable = messageSubject.pipe(
    map((msg) => {
      const parsedMessage = JSON.parse(decoder.decode(msg.payload)) as ChatMessage;
      const newMessage: ReceivedChatMessage = { ...parsedMessage, from: msg.from };
      return newMessage;
    }),
    scan<ReceivedChatMessage, ReceivedChatMessage[]>((acc, value) => [...acc, value], []),
    takeUntil(onDestroyObservable),
  );

  const isSending$ = new BehaviorSubject<boolean>(false);

  const send = async (message: string) => {
    const timestamp = Date.now();
    const encodedMsg = encoder.encode(JSON.stringify({ timestamp, message }));
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
