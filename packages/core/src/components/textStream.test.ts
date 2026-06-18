import type { Room, TextStreamInfo, TextStreamReader } from 'livekit-client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ParticipantAgentAttributes } from '../helper';
import { setupTextStream, type TextStreamData } from './textStream';

const SEGMENT_ATTR = ParticipantAgentAttributes.TranscriptionSegmentId;
const TOPIC = 'lk.transcription';

type StreamHandler = (
  reader: TextStreamReader,
  participantInfo: { identity: string },
) => void | Promise<void>;

/**
 * An async-iterable stand-in for a `TextStreamReader` whose text only flows once `release()`
 * is called. This lets a test open several streams (capturing their first-received time) and
 * then deliver their text in a different order than they were opened.
 */
class ControllableStream {
  info: TextStreamInfo;
  private chunks: string[];
  private gate: Promise<void>;
  private openGate!: () => void;

  constructor(info: TextStreamInfo, chunks: string[]) {
    this.info = info;
    this.chunks = chunks;
    this.gate = new Promise<void>((resolve) => {
      this.openGate = resolve;
    });
  }

  /** Let this stream's text start flowing. */
  release() {
    this.openGate();
  }

  async *[Symbol.asyncIterator]() {
    await this.gate;
    for (const chunk of this.chunks) {
      yield chunk;
    }
  }
}

function transcriptionInfo(id: string, segmentId: string, timestamp: number): TextStreamInfo {
  return {
    id,
    topic: TOPIC,
    timestamp,
    mimeType: 'text/plain',
    attributes: { [SEGMENT_ATTR]: segmentId },
  } as unknown as TextStreamInfo;
}

function createMockRoom() {
  let handler: StreamHandler | undefined;
  const room = {
    registerTextStreamHandler: (_topic: string, cb: StreamHandler) => {
      handler = cb;
    },
    unregisterTextStreamHandler: () => {
      handler = undefined;
    },
    on: () => room,
    off: () => room,
  };
  return {
    room: room as unknown as Room,
    open(stream: ControllableStream, identity: string) {
      if (!handler) throw new Error('no text stream handler registered yet');
      return handler(stream as unknown as TextStreamReader, { identity });
    },
  };
}

/** Let queued microtasks (async-iterator pulls) settle. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('setupTextStream ordering', () => {
  let now = 0;

  beforeEach(() => {
    now = 1_000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('orders by first receipt of the segment, not by when its text finishes streaming (issue #1280)', async () => {
    const { room, open } = createMockRoom();
    const emissions: TextStreamData[][] = [];
    const sub = setupTextStream(room, TOPIC).subscribe((streams) => emissions.push(streams));

    // The user speaks first, so their transcription stream is opened first...
    now = 1_000;
    const user = new ControllableStream(transcriptionInfo('user-1', 'seg-user', 1_000), ['Hello']);
    open(user, 'user');

    // ...then the agent replies, opening its stream a moment later.
    now = 2_000;
    const agent = new ControllableStream(transcriptionInfo('agent-1', 'seg-agent', 2_000), [
      'Hi there!',
    ]);
    open(agent, 'agent');

    // But the agent's text streams in immediately while the user's transcript lags behind.
    agent.release();
    await flush();
    user.release();
    await flush();

    const final = emissions.at(-1)!;
    expect(final.map((s) => s.participantInfo.identity)).toEqual(['user', 'agent']);
    expect(final.map((s) => s.text)).toEqual(['Hello', 'Hi there!']);

    sub.unsubscribe();
  });

  it('orders by local first-received time, not the sender-stamped timestamp (DL clock drift)', async () => {
    const { room, open } = createMockRoom();
    const emissions: TextStreamData[][] = [];
    const sub = setupTextStream(room, TOPIC).subscribe((streams) => emissions.push(streams));

    // First message opened locally, but its sender's clock is running far ahead (timestamp 9000).
    now = 1_000;
    const first = new ControllableStream(transcriptionInfo('first-1', 'seg-first', 9_000), [
      'first',
    ]);
    open(first, 'participant-a');

    // Second message opened locally later, but carries an earlier sender timestamp (1000).
    now = 2_000;
    const second = new ControllableStream(transcriptionInfo('second-1', 'seg-second', 1_000), [
      'second',
    ]);
    open(second, 'participant-b');

    // Deliver text in reverse order of opening. Insertion order would give [second, first];
    // sorting by the sender timestamp would also give [second, first]. Only first-received
    // ordering yields the chronological [first, second].
    second.release();
    await flush();
    first.release();
    await flush();

    const final = emissions.at(-1)!;
    expect(final.map((s) => s.text)).toEqual(['first', 'second']);

    sub.unsubscribe();
  });

  it('keeps a transcription in place (and updates its text) when a later segment update arrives', async () => {
    const { room, open } = createMockRoom();
    const emissions: TextStreamData[][] = [];
    const sub = setupTextStream(room, TOPIC).subscribe((streams) => emissions.push(streams));

    // A transcription segment is created first.
    now = 1_000;
    const create = new ControllableStream(transcriptionInfo('seg-a-create', 'seg-a', 1_000), [
      'partial',
    ]);
    open(create, 'speaker');
    create.release();
    await flush();

    // A second, unrelated transcription opens afterwards.
    now = 2_000;
    const other = new ControllableStream(transcriptionInfo('other-1', 'seg-other', 2_000), [
      'other',
    ]);
    open(other, 'speaker-2');
    other.release();
    await flush();

    // Now an update for the first segment arrives much later, as its own stream.
    now = 5_000;
    const update = new ControllableStream(transcriptionInfo('seg-a-update', 'seg-a', 5_000), [
      'partial then final',
    ]);
    open(update, 'speaker');
    update.release();
    await flush();

    const final = emissions.at(-1)!;
    // The updated segment must keep its original (earlier) position rather than jumping to the end.
    expect(final.map((s) => s.participantInfo.identity)).toEqual(['speaker', 'speaker-2']);
    expect(final[0].text).toBe('partial then final');
    expect(final[0].streamInfo.attributes?.[SEGMENT_ATTR]).toBe('seg-a');

    sub.unsubscribe();
  });
});
