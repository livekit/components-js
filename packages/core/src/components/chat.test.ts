import type { Room } from 'livekit-client';
import { DataStreamError, DataStreamErrorReason, RoomEvent } from 'livekit-client';
import { describe, expect, it, vi } from 'vitest';
import { log } from '../logger';
import { setupChat } from './chat';
import type { ReceivedChatMessage } from '../messages/types';

type TextReader = AsyncIterable<string> & {
  info: {
    id: string;
    timestamp: number;
    attributes?: Record<string, string>;
    attachedStreamIds?: string[];
  };
};

type ByteReader = AsyncIterable<Uint8Array> & {
  info: { id: string; name: string; mimeType: string };
};

const byteReader = (id: string, body: () => AsyncGenerator<Uint8Array>): ByteReader => ({
  info: { id, name: `${id}.bin`, mimeType: 'application/octet-stream' },
  [Symbol.asyncIterator]: body,
});

type TextStreamHandler = (
  reader: TextReader,
  participantInfo: { identity: string },
) => Promise<void>;
type ByteStreamHandler = (reader: ByteReader) => Promise<void>;

const makeRoom = () => {
  const textHandlers = new Map<string, TextStreamHandler>();
  const byteHandlers = new Map<string, ByteStreamHandler>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const roomEvents = new Map<string, Array<(...args: any[]) => void>>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const record = (event: string, handler: (...args: any[]) => void) => {
    roomEvents.set(event, [...(roomEvents.get(event) ?? []), handler]);
    return room;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const remove = (event: string, handler: (...args: any[]) => void) => {
    roomEvents.set(
      event,
      (roomEvents.get(event) ?? []).filter((registered) => registered !== handler),
    );
    return room;
  };
  const room = {
    serverInfo: { edition: 1 },
    registerTextStreamHandler: (topic: string, handler: TextStreamHandler) => {
      textHandlers.set(topic, handler);
    },
    registerByteStreamHandler: (topic: string, handler: ByteStreamHandler) => {
      byteHandlers.set(topic, handler);
    },
    unregisterTextStreamHandler: (topic: string) => {
      textHandlers.delete(topic);
    },
    unregisterByteStreamHandler: (topic: string) => {
      byteHandlers.delete(topic);
    },
    on: record,
    off: remove,
    once: record,
    getParticipantByIdentity: () => undefined,
  } as unknown as Room;
  const emitRoomEvent = (event: string, ...args: unknown[]) => {
    for (const handler of roomEvents.get(event) ?? []) {
      handler(...args);
    }
  };
  const listenerCount = (event: string) => roomEvents.get(event)?.length ?? 0;
  return { room, textHandlers, byteHandlers, emitRoomEvent, listenerCount };
};

const textReader = (id: string, text: string, attachedStreamIds: string[]): TextReader => ({
  info: { id, timestamp: Date.now(), attributes: {}, attachedStreamIds },
  async *[Symbol.asyncIterator]() {
    yield text;
  },
});

const settle = () => new Promise((resolve) => setTimeout(resolve, 10));

/** A byte reader that records whether the handler started reading it. */
const trackedByteReader = (id: string) => {
  const reader = {
    started: false,
    info: { id, name: `${id}.bin`, mimeType: 'application/octet-stream' },
    async *[Symbol.asyncIterator]() {
      reader.started = true;
      yield new TextEncoder().encode('file body');
    },
  };
  return reader;
};

describe('setupChat with attachments', () => {
  it('settles the message pipeline when an attachment stream ends abnormally', async () => {
    const unhandled: unknown[] = [];
    const onUnhandled = (reason: unknown) => {
      unhandled.push(reason);
    };
    process.on('unhandledRejection', onUnhandled);
    const debugSpy = vi.spyOn(log, 'debug').mockImplementation(() => {});
    try {
      const { room, textHandlers, byteHandlers } = makeRoom();
      const emissions: ReceivedChatMessage[][] = [];
      const chat = setupChat(room);
      const subscription = chat.messageObservable.subscribe((messages) => {
        emissions.push(messages);
      });

      const textHandler = textHandlers.get('lk.chat');
      const byteHandler = byteHandlers.get('lk.chat');
      if (!textHandler || !byteHandler) {
        throw new Error('chat stream handlers were not registered');
      }

      await textHandler(textReader('msg-1', 'hello with attachment', ['att-1']), {
        identity: 'sender',
      });
      const abnormalEnd = new DataStreamError(
        'Participant sender unexpectedly disconnected in the middle of sending data',
        DataStreamErrorReason.AbnormalEnd,
      );
      await byteHandler({
        info: { id: 'att-1', name: 'photo.png', mimeType: 'image/png' },
        async *[Symbol.asyncIterator]() {
          throw abnormalEnd;
        },
      });
      await settle();

      expect(unhandled).toEqual([]);
      expect(emissions.flat()).toEqual([]);
      // The SDK's own error object is logged as is, with its reason and message.
      expect(debugSpy).toHaveBeenCalledWith('chat message stream ended abnormally', abnormalEnd);

      // The pipeline stays healthy: a later message with a completing
      // attachment still delivers.
      await textHandler(textReader('msg-2', 'second message', ['att-2']), {
        identity: 'sender',
      });
      await byteHandler({
        info: { id: 'att-2', name: 'notes.txt', mimeType: 'text/plain' },
        async *[Symbol.asyncIterator]() {
          yield new TextEncoder().encode('file body');
        },
      });
      await vi.waitFor(() => {
        const messages = emissions.at(-1) ?? [];
        expect(messages.map((message) => message.message)).toEqual(['second message']);
        expect(messages[0]?.attachedFiles?.[0]?.name).toBe('notes.txt');
      });

      subscription.unsubscribe();
    } finally {
      process.off('unhandledRejection', onUnhandled);
      debugSpy.mockRestore();
    }
  });

  it('does not surface an unhandled rejection when a later attachment fails first', async () => {
    const unhandled: unknown[] = [];
    const onUnhandled = (reason: unknown) => {
      unhandled.push(reason);
    };
    process.on('unhandledRejection', onUnhandled);
    const debugSpy = vi.spyOn(log, 'debug').mockImplementation(() => {});
    try {
      const { room, textHandlers, byteHandlers } = makeRoom();
      const chat = setupChat(room);
      const subscription = chat.messageObservable.subscribe(() => {});

      const textHandler = textHandlers.get('lk.chat');
      const byteHandler = byteHandlers.get('lk.chat');
      if (!textHandler || !byteHandler) {
        throw new Error('chat stream handlers were not registered');
      }

      await textHandler(textReader('msg-race', 'two attachments', ['att-a', 'att-b']), {
        identity: 'sender',
      });
      await settle();

      // `concatMap` subscribes to the attachment futures one at a time, so
      // nothing is listening to att-b while att-a is still in flight -
      // rejecting it must not surface globally.
      await byteHandler(
        byteReader('att-b', async function* () {
          throw new DataStreamError(
            'Participant sender unexpectedly disconnected in the middle of sending data',
            DataStreamErrorReason.AbnormalEnd,
          );
        }),
      );
      await settle();

      expect(unhandled).toEqual([]);
      subscription.unsubscribe();
    } finally {
      process.off('unhandledRejection', onUnhandled);
      debugSpy.mockRestore();
    }
  });

  it('settles the message when an attachment byte stream never arrives at all', async () => {
    const unhandled: unknown[] = [];
    const onUnhandled = (reason: unknown) => {
      unhandled.push(reason);
    };
    process.on('unhandledRejection', onUnhandled);
    const debugSpy = vi.spyOn(log, 'debug').mockImplementation(() => {});
    const warnSpy = vi.spyOn(log, 'warn').mockImplementation(() => {});
    try {
      const { room, textHandlers, byteHandlers, emitRoomEvent, listenerCount } = makeRoom();
      const emissions: ReceivedChatMessage[][] = [];
      const chat = setupChat(room);
      const subscription = chat.messageObservable.subscribe((messages) => {
        emissions.push(messages);
      });

      const textHandler = textHandlers.get('lk.chat');
      const byteHandler = byteHandlers.get('lk.chat');
      if (!textHandler || !byteHandler) {
        throw new Error('chat stream handlers were not registered');
      }

      // The text arrives complete, but the sender drops before ever opening
      // the attachment byte stream - no controller exists for livekit-client
      // to error, so only the disconnect event can end the message.
      await textHandler(textReader('msg-gone', 'text arrived, attachment never did', ['att-x']), {
        identity: 'sender',
      });
      await settle();
      expect(listenerCount(RoomEvent.ParticipantDisconnected)).toBe(1);

      // Another participant leaving does not end it.
      emitRoomEvent(RoomEvent.ParticipantDisconnected, { identity: 'someone-else' });
      await settle();
      expect(listenerCount(RoomEvent.ParticipantDisconnected)).toBe(1);

      emitRoomEvent(RoomEvent.ParticipantDisconnected, { identity: 'sender' });
      await settle();

      // Terminal state: the message is dropped (consistent with a mid-transfer
      // attachment failure) and completes rather than errors, so nothing is
      // logged or rejected and its listener and attachment entry are gone.
      expect(unhandled).toEqual([]);
      expect(emissions.flat()).toEqual([]);
      expect(debugSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
      expect(listenerCount(RoomEvent.ParticipantDisconnected)).toBe(0);
      const lateAttachment = trackedByteReader('att-x');
      await byteHandler(lateAttachment);
      expect(lateAttachment.started).toBe(false);

      // The pipeline stays healthy for the next message.
      await textHandler(textReader('msg-after', 'later message', ['att-y']), {
        identity: 'sender-2',
      });
      await byteHandler(
        byteReader('att-y', async function* () {
          yield new TextEncoder().encode('file body');
        }),
      );
      await vi.waitFor(() => {
        const messages = emissions.at(-1) ?? [];
        expect(messages.map((message) => message.message)).toEqual(['later message']);
      });

      subscription.unsubscribe();
    } finally {
      process.off('unhandledRejection', onUnhandled);
      debugSpy.mockRestore();
      warnSpy.mockRestore();
    }
  });

  it('ends a message still waiting on an attachment when the local room disconnects', async () => {
    const unhandled: unknown[] = [];
    const onUnhandled = (reason: unknown) => {
      unhandled.push(reason);
    };
    process.on('unhandledRejection', onUnhandled);
    try {
      const { room, textHandlers, byteHandlers, emitRoomEvent, listenerCount } = makeRoom();
      const chat = setupChat(room);
      const subscription = chat.messageObservable.subscribe(() => {});

      const textHandler = textHandlers.get('lk.chat');
      const byteHandler = byteHandlers.get('lk.chat');
      if (!textHandler || !byteHandler) {
        throw new Error('chat stream handlers were not registered');
      }

      await textHandler(textReader('msg-local', 'waiting on attachment', ['att-local']), {
        identity: 'sender',
      });
      await settle();
      expect(listenerCount(RoomEvent.ParticipantDisconnected)).toBe(1);

      // On a local disconnect livekit-client drops open stream controllers
      // without erroring them and emits no ParticipantDisconnected, so only
      // the room's own disconnect can end the message.
      emitRoomEvent(RoomEvent.Disconnected);
      await settle();

      expect(unhandled).toEqual([]);
      expect(listenerCount(RoomEvent.ParticipantDisconnected)).toBe(0);
      const lateAttachment = trackedByteReader('att-local');
      await byteHandler(lateAttachment);
      expect(lateAttachment.started).toBe(false);

      subscription.unsubscribe();
    } finally {
      process.off('unhandledRejection', onUnhandled);
    }
  });

  it('keeps the text already delivered when the sender leaves mid-stream', async () => {
    const unhandled: unknown[] = [];
    const onUnhandled = (reason: unknown) => {
      unhandled.push(reason);
    };
    process.on('unhandledRejection', onUnhandled);
    const debugSpy = vi.spyOn(log, 'debug').mockImplementation(() => {});
    try {
      const { room, textHandlers, emitRoomEvent } = makeRoom();
      const emissions: ReceivedChatMessage[][] = [];
      const chat = setupChat(room);
      const subscription = chat.messageObservable.subscribe((messages) => {
        emissions.push(messages);
      });

      const textHandler = textHandlers.get('lk.chat');
      if (!textHandler) {
        throw new Error('chat stream handlers were not registered');
      }

      let failRead: (error: Error) => void = () => {};
      const pendingRead = new Promise<string>((_, reject) => {
        failRead = reject;
      });
      await textHandler(
        {
          info: { id: 'msg-cut', timestamp: Date.now(), attributes: {} },
          async *[Symbol.asyncIterator]() {
            yield 'Hello ';
            yield await pendingRead;
          },
        },
        { identity: 'sender' },
      );
      await settle();

      // Same order as livekit-client: the open stream is errored, then
      // ParticipantDisconnected is emitted in the same tick.
      failRead(
        new DataStreamError(
          'Participant sender unexpectedly disconnected in the middle of sending data',
          DataStreamErrorReason.AbnormalEnd,
        ),
      );
      emitRoomEvent(RoomEvent.ParticipantDisconnected, { identity: 'sender' });
      await settle();

      expect(unhandled).toEqual([]);
      expect(emissions.at(-1)?.map((message) => message.message)).toEqual(['Hello ']);

      subscription.unsubscribe();
    } finally {
      process.off('unhandledRejection', onUnhandled);
      debugSpy.mockRestore();
    }
  });

  it('leaves pending attachments in other rooms alone when a same-named participant leaves', async () => {
    const debugSpy = vi.spyOn(log, 'debug').mockImplementation(() => {});
    try {
      const roomA = makeRoom();
      const roomB = makeRoom();
      const chatA = setupChat(roomA.room);
      const chatB = setupChat(roomB.room);
      const emissionsB: ReceivedChatMessage[][] = [];
      const subscriptionA = chatA.messageObservable.subscribe(() => {});
      const subscriptionB = chatB.messageObservable.subscribe((messages) => {
        emissionsB.push(messages);
      });

      const textHandlerB = roomB.textHandlers.get('lk.chat');
      const byteHandlerB = roomB.byteHandlers.get('lk.chat');
      if (!textHandlerB || !byteHandlerB) {
        throw new Error('chat stream handlers were not registered');
      }

      // Room B has a message waiting on its attachment from "agent".
      await textHandlerB(textReader('msg-room-b', 'message in room B', ['att-room-b']), {
        identity: 'agent',
      });
      await settle();

      // A participant with the same identity leaves room A.
      roomA.emitRoomEvent(RoomEvent.ParticipantDisconnected, { identity: 'agent' });
      await settle();
      expect(roomB.listenerCount(RoomEvent.ParticipantDisconnected)).toBe(1);

      // Room B's attachment still arrives and completes its message.
      await byteHandlerB(
        byteReader('att-room-b', async function* () {
          yield new TextEncoder().encode('file body');
        }),
      );
      await vi.waitFor(() => {
        const messages = emissionsB.at(-1) ?? [];
        expect(messages.map((message) => message.message)).toEqual(['message in room B']);
      });

      subscriptionA.unsubscribe();
      subscriptionB.unsubscribe();
    } finally {
      debugSpy.mockRestore();
    }
  });

  it('warns instead of debug-logging when an attachment fails for another reason', async () => {
    const warnSpy = vi.spyOn(log, 'warn').mockImplementation(() => {});
    try {
      const { room, textHandlers, byteHandlers } = makeRoom();
      const chat = setupChat(room);
      const subscription = chat.messageObservable.subscribe(() => {});

      const textHandler = textHandlers.get('lk.chat');
      const byteHandler = byteHandlers.get('lk.chat');
      if (!textHandler || !byteHandler) {
        throw new Error('chat stream handlers were not registered');
      }

      await textHandler(textReader('msg-3', 'message', ['att-3']), { identity: 'sender' });
      await byteHandler({
        info: { id: 'att-3', name: 'photo.png', mimeType: 'image/png' },
        async *[Symbol.asyncIterator]() {
          throw new Error('decompression failed');
        },
      });
      await settle();

      expect(warnSpy).toHaveBeenCalledWith('chat message stream failed', expect.any(Error));
      subscription.unsubscribe();
    } finally {
      warnSpy.mockRestore();
    }
  });
});
