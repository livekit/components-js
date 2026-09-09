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

/** `from(reader)` walks the async iterator, so emissions land a few microtasks later. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const TOPIC = 'lk.transcription';

describe('setupTextStream', () => {
  it('reuses one observable per room and topic across disconnect/reconnect', () => {
    const { room, registerTextStreamHandler, disconnect } = createFakeRoom();

    // A consumer subscribes while connected, then the room disconnects and
    // `useTextStream` drops the subscription.
    const first = setupTextStream(room, TOPIC);
    first.subscribe().unsubscribe();
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

  it('caches per room instance, so a second room gets its own observable', () => {
    const a = createFakeRoom();
    const b = createFakeRoom();

    expect(setupTextStream(a.room, TOPIC)).not.toBe(setupTextStream(b.room, TOPIC));
  });

  it('starts each subscription window with an empty buffer', async () => {
    const { room, push } = createFakeRoom();

    const stream = setupTextStream(room, TOPIC);
    const before: number[] = [];
    const firstSub = stream.subscribe((streams) => before.push(streams.length));
    await push(TOPIC, fakeReader('stream-1', ['hello']));
    await flush();
    expect(before.at(-1)).toBe(1);
    firstSub.unsubscribe();

    // Reconnect: the buffer from the previous window must not leak into this one.
    const after: number[] = [];
    const secondSub = stream.subscribe((streams) => after.push(streams.length));
    await push(TOPIC, fakeReader('stream-2', ['world']));
    await flush();

    expect(after).toEqual([1]);
    secondSub.unsubscribe();
  });
});
