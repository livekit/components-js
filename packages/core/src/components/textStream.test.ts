import type { Room } from 'livekit-client';
import { describe, expect, it, vi } from 'vitest';
import { log } from '../logger';
import { setupTextStream, type TextStreamData } from './textStream';

type TextStreamHandler = (
  reader: AsyncIterable<string> & { info: { id: string; attributes?: Record<string, string> } },
  participantInfo: { identity: string },
) => Promise<void>;

const makeRoom = () => {
  const handlers = new Map<string, TextStreamHandler>();
  const room = {
    registerTextStreamHandler: (topic: string, handler: TextStreamHandler) => {
      handlers.set(topic, handler);
    },
    unregisterTextStreamHandler: (topic: string) => {
      handlers.delete(topic);
    },
    on: () => room,
  } as unknown as Room;
  return { room, handlers };
};

describe('setupTextStream', () => {
  it('keeps the accumulated text when a stream ends abnormally instead of rethrowing', async () => {
    const { room, handlers } = makeRoom();
    const debugSpy = vi.spyOn(log, 'debug').mockImplementation(() => {});

    const emissions: TextStreamData[][] = [];
    const subscription = setupTextStream(room, 'lk.transcription').subscribe((streams) => {
      emissions.push(streams);
    });

    const handler = handlers.get('lk.transcription');
    if (!handler) {
      throw new Error('text stream handler was not registered');
    }

    const abnormalEnd = new Error(
      'Participant agent-x unexpectedly disconnected in the middle of sending data',
    );
    await handler(
      {
        info: { id: 'stream-1', attributes: {} },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async *[Symbol.asyncIterator]() {
          yield 'Hello ';
          yield 'world';
          throw abnormalEnd;
        },
      },
      { identity: 'agent-x' },
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    const lastEmission = emissions.at(-1);
    expect(lastEmission?.[0]?.text).toBe('Hello world');
    expect(debugSpy).toHaveBeenCalledWith('text stream ended abnormally', abnormalEnd);

    subscription.unsubscribe();
    debugSpy.mockRestore();
  });
});
