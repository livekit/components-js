/* eslint-disable camelcase */
import { DataPacket_Kind, Participant, Room } from 'livekit-client';
import { BehaviorSubject, Subject } from 'rxjs';
import { scan, map, takeUntil } from 'rxjs/operators';
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
  console.log('xxx setupChat()');
  const onDestroy$ = new Subject<void>();
  const subject$ = new Subject<{
    payload: Uint8Array;
    topic: string | undefined;
    from: Participant | undefined;
  }>();

  /** Subscribe to all messages send over the wire. */
  const { messageObservable } = setupDataMessageHandler(room, DataTopic.CHAT);
  messageObservable.pipe(takeUntil(onDestroy$)).subscribe(subject$);

  /** Build up the message array over time. */
  const messages$ = subject$.pipe(
    map((msg) => {
      const parsedMessage = JSON.parse(decoder.decode(msg.payload)) as ChatMessage;
      const newMessage: ReceivedChatMessage = { ...parsedMessage, from: msg.from };
      return newMessage;
    }),
    scan<ReceivedChatMessage, ReceivedChatMessage[]>((acc, value) => [...acc, value], []),
    takeUntil(onDestroy$),
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
      subject$.next({
        payload: encodedMsg,
        topic: DataTopic.CHAT,
        from: room.localParticipant,
      });
    } finally {
      isSending$.next(false);
    }
  };

  function destroy() {
    console.log('xxx destroy()');
    onDestroy$.next();
    onDestroy$.complete();
  }

  return { messageObservable: messages$, isSendingObservable: isSending$, send, destroy };
}
