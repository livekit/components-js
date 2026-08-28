import type { Room } from 'livekit-client';
import { DataStreamError, DataStreamErrorReason } from 'livekit-client';
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

type TextStreamHandler = (
  reader: TextReader,
  participantInfo: { identity: string },
) => Promise<void>;
type ByteStreamHandler = (reader: ByteReader) => Promise<void>;

const makeRoom = () => {
  const textHandlers = new Map<string, TextStreamHandler>();
  const byteHandlers = new Map<string, ByteStreamHandler>();
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
    on: () => room,
    off: () => room,
    once: () => room,
    getParticipantByIdentity: () => undefined,
  } as unknown as Room;
  return { room, textHandlers, byteHandlers };
};

const textReader = (id: string, text: string, attachedStreamIds: string[]): TextReader => ({
  info: { id, timestamp: Date.now(), attributes: {}, attachedStreamIds },
  async *[Symbol.asyncIterator]() {
    yield text;
  },
});

const settle = () => new Promise((resolve) => setTimeout(resolve, 10));

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
      await byteHandler({
        info: { id: 'att-1', name: 'photo.png', mimeType: 'image/png' },
        async *[Symbol.asyncIterator]() {
          throw new DataStreamError(
            'Participant sender unexpectedly disconnected in the middle of sending data',
            DataStreamErrorReason.AbnormalEnd,
          );
        },
      });
      await settle();

      expect(unhandled).toEqual([]);
      expect(emissions.flat()).toEqual([]);
      expect(debugSpy).toHaveBeenCalledWith(
        'chat message stream ended abnormally',
        expect.any(DataStreamError),
      );

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
