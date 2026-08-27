import { RoomEvent, type Room } from 'livekit-client';
import { describe, expect, it, vi } from 'vitest';
import { setupTextStream } from './textStream';

/**
 * Minimal stand-in for `Room` that mirrors livekit-client's one-handler-per-topic
 * contract: registering the same topic twice throws.
 */
function createFakeRoom() {
  const handlers = new Map<string, (reader: unknown, participantInfo: unknown) => Promise<void>>();
  const disconnectListeners: Array<() => void> = [];

  const registerTextStreamHandler = vi.fn(
    (topic: string, handler: (reader: unknown, participantInfo: unknown) => Promise<void>) => {
      if (handlers.has(topic)) {
        throw new Error(`A text stream handler for topic "${topic}" has already been set.`);
      }
      handlers.set(topic, handler);
    },
  );
  const unregisterTextStreamHandler = vi.fn((topic: string) => {
    handlers.delete(topic);
  });

  const room = {
    registerTextStreamHandler,
    unregisterTextStreamHandler,
    on: (event: RoomEvent, listener: () => void) => {
      if (event === RoomEvent.Disconnected) disconnectListeners.push(listener);
      return room;
    },
  } as unknown as Room;

  return {
    room,
    registerTextStreamHandler,
    unregisterTextStreamHandler,
    disconnect: () => disconnectListeners.forEach((listener) => listener()),
    push: (topic: string, reader: unknown) => handlers.get(topic)?.(reader, { identity: 'agent' }),
  };
}

function fakeReader(id: string, chunks: string[]) {
  return {
    info: { id, attributes: {} },
    async *[Symbol.asyncIterator]() {
      for (const chunk of chunks) yield chunk;
    },
  };
}

const TOPIC = 'lk.transcription';

describe('setupTextStream', () => {
  it('keeps one observable per topic across a disconnect, so a later subscriber shares the handler', () => {
    const { room, registerTextStreamHandler, disconnect } = createFakeRoom();

    // A consumer subscribes while connected.
    const first = setupTextStream(room, TOPIC);
    first.subscribe().unsubscribe(); // disconnect makes every consumer unsubscribe

    disconnect();
    registerTextStreamHandler.mockClear();

    // A consumer that mounts *while disconnected* must get the same observable.
    // Two observables for one topic both register it on reconnect, and the
    // second call throws `A text stream handler ... has already been set`.
    const second = setupTextStream(room, TOPIC);

    const subA = first.subscribe();
    const subB = second.subscribe();

    expect(registerTextStreamHandler).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);

    subA.unsubscribe();
    subB.unsubscribe();
  });

  it('clears buffered streams on disconnect', async () => {
    const { room, disconnect, push } = createFakeRoom();
    const emitted: number[] = [];

    const stream = setupTextStream(room, TOPIC);
    const sub = stream.subscribe((streams) => emitted.push(streams.length));

    await push(TOPIC, fakeReader('stream-1', ['hello']));
    await Promise.resolve();

    disconnect();

    expect(emitted.at(-1)).toBe(0);
    sub.unsubscribe();
  });
});
