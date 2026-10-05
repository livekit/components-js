import { Encryption_Type } from '@livekit/protocol';
import { Room, RoomEvent, type TextStreamInfo } from 'livekit-client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Future } from '../helper/future';
import { setupChat } from './chat';

describe('chat sending state', () => {
  const rooms: Room[] = [];
  const streamInfo: TextStreamInfo = {
    id: 'message',
    topic: 'lk.chat',
    timestamp: 1,
    mimeType: 'text/plain',
    encryptionType: Encryption_Type.NONE,
  };

  afterEach(() => {
    rooms.forEach((room) => room.emit(RoomEvent.Disconnected));
    rooms.length = 0;
    vi.restoreAllMocks();
  });

  it.each(['resolve', 'reject'] as const)(
    'keeps sending state true when an overlapping text send finishes with %s',
    async (outcome) => {
      const room = new Room();
      rooms.push(room);
      const firstText = new Future<TextStreamInfo, Error>();
      const secondText = new Future<TextStreamInfo, Error>();
      vi.spyOn(room.localParticipant, 'sendText')
        .mockReturnValueOnce(firstText.promise)
        .mockReturnValueOnce(secondText.promise);
      vi.spyOn(room.localParticipant, 'publishData').mockResolvedValue();
      const { send, isSendingObservable } = setupChat(room);
      const states: boolean[] = [];
      const subscription = isSendingObservable.subscribe((value) => states.push(value));
      const first = send('first');
      const second = send('second');
      const error = new Error('text send failed');

      try {
        expect(states.at(-1)).toBe(true);
        if (outcome === 'resolve') {
          firstText.resolve?.({ ...streamInfo, id: 'first' });
          await expect(first).resolves.toMatchObject({ id: 'first', message: 'first' });
        } else {
          const rejected = expect(first).rejects.toBe(error);
          firstText.reject?.(error);
          await rejected;
        }
        expect(states.at(-1)).toBe(true);
        const late = vi.fn();
        const lateSubscription = isSendingObservable.subscribe(late);
        expect(late).toHaveBeenCalledExactlyOnceWith(true);
        lateSubscription.unsubscribe();

        secondText.resolve?.({ ...streamInfo, id: 'second' });
        await expect(second).resolves.toMatchObject({ id: 'second', message: 'second' });
        expect(states.at(-1)).toBe(false);
      } finally {
        firstText.resolve?.(streamInfo);
        secondText.resolve?.(streamInfo);
        await Promise.allSettled([first, second]);
        subscription.unsubscribe();
      }
    },
  );

  it.each(['resolve', 'reject'] as const)(
    'waits for all overlapping legacy publishes when the first finishes with %s',
    async (outcome) => {
      const room = new Room();
      rooms.push(room);
      vi.spyOn(room.localParticipant, 'sendText').mockResolvedValue(streamInfo);
      const firstPublish = new Future<void, Error>();
      const secondPublish = new Future<void, Error>();
      const publish = vi
        .spyOn(room.localParticipant, 'publishData')
        .mockReturnValueOnce(firstPublish.promise)
        .mockReturnValueOnce(secondPublish.promise);
      const { send, isSendingObservable } = setupChat(room);
      const states: boolean[] = [];
      const subscription = isSendingObservable.subscribe((value) => states.push(value));
      const first = send('first');
      const second = send('second');

      try {
        await vi.waitFor(() => expect(publish).toHaveBeenCalledTimes(2));
        if (outcome === 'resolve') {
          firstPublish.resolve?.();
        } else {
          firstPublish.reject?.(new Error('legacy publish failed'));
        }
        await expect(first).resolves.toMatchObject({ message: 'first' });
        expect(states.at(-1)).toBe(true);

        secondPublish.resolve?.();
        await expect(second).resolves.toMatchObject({ message: 'second' });
        expect(states.at(-1)).toBe(false);
      } finally {
        firstPublish.resolve?.();
        secondPublish.resolve?.();
        await Promise.allSettled([first, second]);
        subscription.unsubscribe();
      }
    },
  );
});
