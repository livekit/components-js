import { DataPacket_Kind, Encryption_Type } from '@livekit/protocol';
import { Room, RoomEvent, type TextStreamInfo } from 'livekit-client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Future } from '../helper/future';
import { setupChat, type ReceivedChatMessage } from './chat';

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
          await expect(first).resolves.toMatchObject({ message: 'first', status: 'sent' });
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
        await expect(second).resolves.toMatchObject({ message: 'second', status: 'sent' });
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

describe('chat message status', () => {
  const rooms: Room[] = [];
  const streamInfo: TextStreamInfo = {
    id: 'stream',
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

  function setup() {
    const room = new Room();
    rooms.push(room);
    vi.spyOn(room.localParticipant, 'publishData').mockResolvedValue();
    const sendText = vi.spyOn(room.localParticipant, 'sendText');
    const chat = setupChat(room);
    let messages: ReceivedChatMessage[] = [];
    const subscription = chat.messageObservable.subscribe((value) => (messages = value));
    return { room, sendText, chat, getMessages: () => messages, subscription };
  }

  it('adds a sent message right away as sending, then marks it sent', async () => {
    const { sendText, chat, getMessages, subscription } = setup();
    const text = new Future<TextStreamInfo, Error>();
    sendText.mockReturnValueOnce(text.promise);

    const sending = chat.send('hello');
    expect(getMessages()).toEqual([
      expect.objectContaining({ message: 'hello', status: 'sending' }),
    ]);
    const { id } = getMessages()[0];

    text.resolve?.(streamInfo);
    await expect(sending).resolves.toMatchObject({ id, status: 'sent' });
    expect(getMessages()).toEqual([expect.objectContaining({ id, status: 'sent' })]);
    expect(getMessages()[0].editTimestamp).toBeUndefined();
    subscription.unsubscribe();
  });

  it('marks a message failed and keeps it when sending fails', async () => {
    const { sendText, chat, getMessages, subscription } = setup();
    const error = new Error('text send failed');
    sendText.mockRejectedValueOnce(error);

    await expect(chat.send('hello')).rejects.toBe(error);

    expect(getMessages()).toEqual([
      expect.objectContaining({ message: 'hello', status: 'failed' }),
    ]);
    subscription.unsubscribe();
  });

  it('resends a failed message in place', async () => {
    const { sendText, chat, getMessages, subscription } = setup();
    sendText.mockRejectedValueOnce(new Error('text send failed'));
    await chat.send('first').catch(() => {});
    sendText.mockResolvedValue(streamInfo);
    await chat.send('second');
    const failed = getMessages()[0];

    const text = new Future<TextStreamInfo, Error>();
    sendText.mockReturnValueOnce(text.promise);
    const resending = chat.resend(failed.id);
    expect(getMessages()[0]).toMatchObject({ id: failed.id, status: 'sending' });

    text.resolve?.(streamInfo);
    await resending;
    expect(getMessages().map(({ message, status }) => ({ message, status }))).toEqual([
      { message: 'first', status: 'sent' },
      { message: 'second', status: 'sent' },
    ]);
    expect(getMessages()[0].timestamp).toBe(failed.timestamp);
    expect(sendText).toHaveBeenLastCalledWith(
      'first',
      expect.objectContaining({ topic: 'lk.chat' }),
    );
    subscription.unsubscribe();
  });

  it('rejects resending a message that is sending or already sent', async () => {
    const { sendText, chat, getMessages, subscription } = setup();
    const text = new Future<TextStreamInfo, Error>();
    sendText.mockReturnValueOnce(text.promise);

    const sending = chat.send('hello');
    const { id } = getMessages()[0];
    await expect(chat.resend(id)).rejects.toThrow('already sending');

    text.resolve?.(streamInfo);
    await sending;
    await expect(chat.resend(id)).rejects.toThrow('No failed message');
    expect(sendText).toHaveBeenCalledTimes(1);
    subscription.unsubscribe();
  });

  it('shares failed messages across setups for the same room, so any can resend them', async () => {
    const { room, sendText, chat, getMessages, subscription } = setup();
    sendText.mockRejectedValueOnce(new Error('text send failed'));
    await chat.send('hello').catch(() => {});

    sendText.mockResolvedValue(streamInfo);
    await setupChat(room).resend(getMessages()[0].id);

    expect(getMessages()).toEqual([expect.objectContaining({ message: 'hello', status: 'sent' })]);
    subscription.unsubscribe();
  });

  it('leaves status unset on messages from other participants', async () => {
    const { room, getMessages, subscription } = setup();

    room.emit(
      RoomEvent.DataReceived,
      new TextEncoder().encode(JSON.stringify({ id: 'remote', timestamp: 1, message: 'hi' })),
      undefined,
      DataPacket_Kind.RELIABLE,
      'lk-chat-topic',
    );

    expect(getMessages()).toEqual([expect.objectContaining({ id: 'remote', message: 'hi' })]);
    expect(getMessages()[0].status).toBeUndefined();
    subscription.unsubscribe();
  });
});
