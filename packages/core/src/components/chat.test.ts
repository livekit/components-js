import { Encryption_Type } from '@livekit/protocol';
import { Room, RoomEvent, type TextStreamInfo } from 'livekit-client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Future } from '../helper/future';
import type { ReceivedChatMessage } from '../messages/types';
import { setupChat } from './chat';
import { TextStreamStatus } from './textStream';

/* eslint-disable @typescript-eslint/no-explicit-any */
type ChatTextStreamHandler = (reader: any, participantInfo: { identity: string }) => Promise<void>;

/** `from(reader)` walks the async iterator, so emissions land a few microtasks later. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('chat text stream errors', () => {
  const rooms: Room[] = [];

  afterEach(() => {
    rooms.forEach((room) => room.emit(RoomEvent.Disconnected));
    rooms.length = 0;
    vi.restoreAllMocks();
  });

  /** Set up chat on a fresh room, capturing the text stream handler it registers. */
  function setupChatCapturingHandler() {
    const room = new Room();
    rooms.push(room);

    let textHandler: ChatTextStreamHandler | undefined;
    vi.spyOn(room, 'registerTextStreamHandler').mockImplementation(((
      _topic: string,
      handler: ChatTextStreamHandler,
    ) => {
      textHandler = handler;
    }) as any);

    const { messageObservable } = setupChat(room);
    let latest: ReceivedChatMessage[] = [];
    const subscription = messageObservable.subscribe((messages) => (latest = messages));
    expect(textHandler).toBeDefined();
    return {
      textHandler: textHandler!,
      subscription,
      get latest() {
        return latest;
      },
    };
  }

  it('surfaces a failed message instead of rethrowing when a chat text stream ends abnormally', async () => {
    const chat = setupChatCapturingHandler();

    // Without the error handler this error is rethrown globally from a timer and
    // fails the test run as an uncaught exception.
    const error = new Error(
      'Participant sender unexpectedly disconnected in the middle of sending data',
    );
    await chat.textHandler(
      {
        info: { id: 'msg-1', timestamp: Date.now(), attributes: {}, attachedStreamIds: [] },
        async *[Symbol.asyncIterator]() {
          yield 'partial message';
          throw error;
        },
      },
      { identity: 'sender' },
    );
    await flush();

    expect(chat.latest).toHaveLength(1);
    expect(chat.latest[0].message).toBe('partial message');
    expect(chat.latest[0].status).toBe(TextStreamStatus.Failed);
    expect(chat.latest[0].status === TextStreamStatus.Failed && chat.latest[0].error).toBe(error);
    chat.subscription.unsubscribe();
  });

  it('keeps the received text when a stream with attachments fails before they resolve', async () => {
    const chat = setupChatCapturingHandler();

    // The attachment's byte stream never arrives, so no message has been emitted
    // yet when the text stream fails.
    const error = new Error('sender disconnected');
    await chat.textHandler(
      {
        info: {
          id: 'msg-1',
          timestamp: Date.now(),
          attributes: {},
          attachedStreamIds: ['attachment-1'],
        },
        async *[Symbol.asyncIterator]() {
          yield 'look at ';
          yield 'this';
          throw error;
        },
      },
      { identity: 'sender' },
    );
    await flush();

    expect(chat.latest).toHaveLength(1);
    expect(chat.latest[0].message).toBe('look at this');
    expect(chat.latest[0].attachedFiles).toEqual([]);
    expect(chat.latest[0].status).toBe(TextStreamStatus.Failed);
    expect(chat.latest[0].status === TextStreamStatus.Failed && chat.latest[0].error).toBe(error);
    chat.subscription.unsubscribe();
  });

  it('emits no message when a chat text stream fails before any chunk', async () => {
    const chat = setupChatCapturingHandler();

    await chat.textHandler(
      {
        info: { id: 'msg-1', timestamp: Date.now(), attributes: {}, attachedStreamIds: [] },
        async *[Symbol.asyncIterator]() {
          throw new Error('abnormal end before any data');
        },
      },
      { identity: 'sender' },
    );
    await flush();

    expect(chat.latest).toEqual([]);
    chat.subscription.unsubscribe();
  });
});
/* eslint-enable @typescript-eslint/no-explicit-any */

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

  it('marks a sent message complete, both as returned and in the message list', async () => {
    const room = new Room();
    rooms.push(room);
    vi.spyOn(room.localParticipant, 'sendText').mockResolvedValue(streamInfo);
    vi.spyOn(room.localParticipant, 'publishData').mockResolvedValue();
    const { send, messageObservable } = setupChat(room);
    let latest: ReceivedChatMessage[] = [];
    const subscription = messageObservable.subscribe((messages) => (latest = messages));

    const sent = await send('hello');

    expect(sent.status).toBe(TextStreamStatus.Complete);
    expect(latest).toEqual([
      expect.objectContaining({ message: 'hello', status: TextStreamStatus.Complete }),
    ]);
    subscription.unsubscribe();
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
