import { DataPacket_Kind, Encryption_Type } from '@livekit/protocol';
import { Room, RoomEvent, type TextStreamReader } from 'livekit-client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setupChat } from './chat';

describe('chat topics', () => {
  const rooms: Room[] = [];

  afterEach(() => {
    rooms.forEach((room) => room.emit(RoomEvent.Disconnected));
    rooms.length = 0;
    vi.restoreAllMocks();
  });

  it('receives legacy messages independently on each topic without duplicate setup', () => {
    const room = new Room();
    rooms.push(room);
    const registerText = vi.spyOn(room, 'registerTextStreamHandler');
    const registerBytes = vi.spyOn(room, 'registerByteStreamHandler');
    const publicChat = setupChat(room);
    const privateChat = setupChat(room, { channelTopic: 'private-chat' });
    const repeatedChat = setupChat(room, { channelTopic: 'private-chat' });
    const publicMessages = vi.fn();
    const privateMessages = vi.fn();
    const repeatedMessages = vi.fn();
    publicChat.messageObservable.subscribe(publicMessages);
    privateChat.messageObservable.subscribe(privateMessages);
    repeatedChat.messageObservable.subscribe(repeatedMessages);

    for (const topic of ['lk-chat-topic', 'private-chat']) {
      room.emit(
        RoomEvent.DataReceived,
        new TextEncoder().encode(JSON.stringify({ id: topic, timestamp: 1, message: topic })),
        undefined,
        DataPacket_Kind.RELIABLE,
        topic,
      );
    }

    expect(publicMessages).toHaveBeenCalledExactlyOnceWith([
      expect.objectContaining({ message: 'lk-chat-topic' }),
    ]);
    expect(privateMessages).toHaveBeenCalledExactlyOnceWith([
      expect.objectContaining({ message: 'private-chat' }),
    ]);
    expect(repeatedMessages).toHaveBeenCalledExactlyOnceWith([
      expect.objectContaining({ message: 'private-chat' }),
    ]);
    expect(registerText.mock.calls.map(([topic]) => topic)).toEqual(['lk.chat', 'private-chat']);
    expect(registerBytes.mock.calls.map(([topic]) => topic)).toEqual(['lk.chat', 'private-chat']);
  });

  it('receives text streams on a second topic and cleans up both topics on disconnect', async () => {
    const room = new Room();
    rooms.push(room);
    const registerText = vi.spyOn(room, 'registerTextStreamHandler');
    const unregisterText = vi.spyOn(room, 'unregisterTextStreamHandler');
    const unregisterBytes = vi.spyOn(room, 'unregisterByteStreamHandler');
    const publicMessages = vi.fn();
    const privateMessages = vi.fn();
    setupChat(room).messageObservable.subscribe(publicMessages);
    setupChat(room, { channelTopic: 'private-chat' }).messageObservable.subscribe(privateMessages);
    const handler = registerText.mock.calls.find(([topic]) => topic === 'private-chat')?.[1];
    expect(handler).toBeDefined();
    if (!handler) throw new Error('Second chat topic has no text stream handler');

    // Only the stream metadata and async iterator are consumed by the chat handler.
    const reader = {
      info: {
        id: 'private-message',
        topic: 'private-chat',
        timestamp: 1,
        mimeType: 'text/plain',
        encryptionType: Encryption_Type.NONE,
      },
      async *[Symbol.asyncIterator]() {
        yield 'hello';
      },
    } as TextStreamReader;
    handler(reader, { identity: 'sender' });
    await vi.waitFor(() =>
      expect(privateMessages).toHaveBeenCalledExactlyOnceWith([
        expect.objectContaining({ id: 'private-message', message: 'hello' }),
      ]),
    );
    expect(publicMessages).not.toHaveBeenCalled();

    room.emit(RoomEvent.Disconnected);
    expect(unregisterText.mock.calls.map(([topic]) => topic)).toEqual(['lk.chat', 'private-chat']);
    expect(unregisterBytes.mock.calls.map(([topic]) => topic)).toEqual(['lk.chat', 'private-chat']);
    expect(room.listenerCount(RoomEvent.DataReceived)).toBe(0);
    expect(() => {
      setupChat(room);
      setupChat(room, { channelTopic: 'private-chat' });
    }).not.toThrow();
    expect(registerText.mock.calls.map(([topic]) => topic)).toEqual([
      'lk.chat',
      'private-chat',
      'lk.chat',
      'private-chat',
    ]);
  });

  it('shares one room teardown across repeated topics and reconnects without affecting other rooms', () => {
    const room = new Room();
    const otherRoom = new Room();
    rooms.push(room, otherRoom);
    const initialListeners = room.listenerCount(RoomEvent.Disconnected);
    const unregisterText = vi.spyOn(room, 'unregisterTextStreamHandler');
    const unregisterBytes = vi.spyOn(room, 'unregisterByteStreamHandler');
    const otherMessages = vi.fn();
    const otherComplete = vi.fn();
    setupChat(otherRoom).messageObservable.subscribe({
      next: otherMessages,
      complete: otherComplete,
    });

    for (let cycle = 0; cycle < 2; cycle++) {
      const completions = ['lk.chat', 'private-chat', 'private-chat'].map((channelTopic) => {
        const complete = vi.fn();
        setupChat(room, { channelTopic }).messageObservable.subscribe({ complete });
        return complete;
      });
      expect(room.listenerCount(RoomEvent.Disconnected)).toBe(initialListeners + 1);
      expect(room.listenerCount(RoomEvent.DataReceived)).toBe(2);

      room.emit(RoomEvent.Disconnected);

      completions.forEach((complete) => expect(complete).toHaveBeenCalledOnce());
      expect(room.listenerCount(RoomEvent.Disconnected)).toBe(initialListeners);
      expect(room.listenerCount(RoomEvent.DataReceived)).toBe(0);
      expect(unregisterText.mock.calls.map(([topic]) => topic)).toEqual([
        'lk.chat',
        'private-chat',
      ]);
      expect(unregisterBytes.mock.calls.map(([topic]) => topic)).toEqual([
        'lk.chat',
        'private-chat',
      ]);
      unregisterText.mockClear();
      unregisterBytes.mockClear();
      room.emit(RoomEvent.Disconnected);
      expect(unregisterText).not.toHaveBeenCalled();
      expect(unregisterBytes).not.toHaveBeenCalled();
    }

    otherRoom.emit(
      RoomEvent.DataReceived,
      new TextEncoder().encode(
        JSON.stringify({ id: 'other', timestamp: 1, message: 'still here' }),
      ),
      undefined,
      DataPacket_Kind.RELIABLE,
      'lk-chat-topic',
    );
    expect(otherMessages).toHaveBeenCalledExactlyOnceWith([
      expect.objectContaining({ message: 'still here' }),
    ]);
    expect(otherComplete).not.toHaveBeenCalled();
  });
});
