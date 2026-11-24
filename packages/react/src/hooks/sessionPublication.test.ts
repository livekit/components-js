import {
  ConnectionState,
  Room,
  Track,
  type LocalTrack,
  type LocalTrackPublication,
} from 'livekit-client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { connectSessionWithTracks } from './sessionPublication';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
}
function setup() {
  const room = new Room();
  const controller = new AbortController();
  const track = { kind: Track.Kind.Audio, stop: vi.fn() } as unknown as LocalTrack;
  const captured = deferred<LocalTrack[]>();
  const attachTrack = vi.fn(async () => ({}) as LocalTrackPublication);
  const cancel = vi.fn(async () => {});
  const reservation = { attachTrack, cancel };
  const prepare = vi.fn(() => reservation);
  const connectNative = vi.fn(async () => {});
  Object.defineProperty(room, Symbol.for('livekit.internal.sessionPublication.v1'), {
    value: { prepare, connect: connectNative },
    configurable: true,
  });
  const capture = vi.spyOn(room.localParticipant, 'createTracks').mockReturnValue(captured.promise);
  vi.spyOn(room, 'disconnect').mockResolvedValue(undefined);
  const connect = vi.fn<(connectRoom: Room['connect']) => Promise<void>>(async () => {});
  return {
    room,
    controller,
    track,
    captured,
    capture,
    prepare,
    connectNative,
    attachTrack,
    cancel,
    reservation,
    connect,
  };
}
afterEach(() => vi.restoreAllMocks());

describe('Session publication startup', () => {
  it('starts JOIN before capture finishes and forwards all publication options', async () => {
    const f = setup();
    const options = { forceStereo: true, red: false, audioPreset: { maxBitrate: 96000 } };
    const starting = connectSessionWithTracks(
      f.room,
      f.connect,
      { microphone: { enabled: true, publishOptions: options } },
      f.controller.signal,
    );
    expect(f.connect).toHaveBeenCalledWith(expect.any(Function));
    await f.connect.mock.calls[0][0]('wss://example.test', 'token');
    expect(f.connectNative).toHaveBeenCalledWith('wss://example.test', 'token', undefined, [
      f.reservation,
    ]);
    expect(f.connect.mock.invocationCallOrder[0]).toBeLessThan(
      f.capture.mock.invocationCallOrder[0],
    );
    expect(f.prepare).toHaveBeenCalledWith({
      source: Track.Source.Microphone,
      publishOptions: options,
    });
    expect(f.attachTrack).not.toHaveBeenCalled();
    f.captured.resolve([f.track]);
    await starting;
    expect(f.attachTrack).toHaveBeenCalledWith(f.track);
    expect(f.track.stop).not.toHaveBeenCalled();
    expect(f.cancel).toHaveBeenCalledOnce();
  });
  it('uses ordinary camera publication even with an ideal configured resolution', async () => {
    const f = setup();
    f.room.options.videoCaptureDefaults = {
      resolution: { width: 1280, height: 720, frameRate: 30 },
    };
    const options = { videoCodec: 'h264' as const, simulcast: false };
    const camera = vi
      .spyOn(f.room.localParticipant, 'setCameraEnabled')
      .mockResolvedValue(undefined);
    await connectSessionWithTracks(
      f.room,
      f.connect,
      { camera: { enabled: true, publishOptions: options } },
      f.controller.signal,
    );
    expect(f.prepare).not.toHaveBeenCalled();
    expect(f.capture).not.toHaveBeenCalled();
    expect(camera).toHaveBeenCalledWith(true, undefined, options);
    expect(f.connect).toHaveBeenCalledOnce();
  });
  it('aborts startup promptly and stops a capture that resolves after end', async () => {
    const f = setup();
    const starting = connectSessionWithTracks(
      f.room,
      f.connect,
      { microphone: { enabled: true } },
      f.controller.signal,
    );
    const rejected = expect(starting).rejects.toThrow();
    f.controller.abort();
    await rejected;
    f.captured.resolve([f.track]);
    await Promise.resolve();
    expect(f.track.stop).toHaveBeenCalledOnce();
    expect(f.attachTrack).not.toHaveBeenCalled();
    expect(f.cancel).toHaveBeenCalled();
    expect(f.room.disconnect).toHaveBeenCalledOnce();
  });
  it('cleans up late capture when JOIN fails', async () => {
    const f = setup();
    f.connect.mockRejectedValue(new Error('join rejected'));
    await expect(
      connectSessionWithTracks(
        f.room,
        f.connect,
        { microphone: { enabled: true } },
        f.controller.signal,
      ),
    ).rejects.toThrow('join rejected');
    f.captured.resolve([f.track]);
    await Promise.resolve();
    expect(f.track.stop).toHaveBeenCalledOnce();
    expect(f.attachTrack).not.toHaveBeenCalled();
    expect(f.cancel).toHaveBeenCalledOnce();
  });
  it('cancels unused reservations and disconnects on permission denial', async () => {
    const f = setup();
    const starting = connectSessionWithTracks(
      f.room,
      f.connect,
      { microphone: { enabled: true } },
      f.controller.signal,
    );
    f.captured.reject(new DOMException('denied', 'NotAllowedError'));
    await expect(starting).rejects.toThrow('denied');
    expect(f.cancel).toHaveBeenCalledOnce();
    expect(f.room.disconnect).toHaveBeenCalledOnce();
  });
  it('stops captured media when attachment fails', async () => {
    const f = setup();
    f.attachTrack.mockRejectedValue(new Error('publication rejected'));
    const starting = connectSessionWithTracks(
      f.room,
      f.connect,
      { microphone: { enabled: true } },
      f.controller.signal,
    );
    f.captured.resolve([f.track]);
    await expect(starting).rejects.toThrow('publication rejected');
    expect(f.track.stop).toHaveBeenCalledOnce();
    expect(f.cancel).toHaveBeenCalledOnce();
  });
  it('stops Session-owned capture on publication timeout without an abort', async () => {
    vi.useFakeTimers();
    try {
      const f = setup();
      f.attachTrack.mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(
              () => reject(new DOMException('publication timeout', 'TimeoutError')),
              15000,
            );
          }),
      );
      const starting = connectSessionWithTracks(
        f.room,
        f.connect,
        { microphone: { enabled: true } },
        f.controller.signal,
      );
      const rejected = expect(starting).rejects.toThrow('publication timeout');
      f.captured.resolve([f.track]);
      await vi.advanceTimersByTimeAsync(15000);
      await rejected;
      expect(f.controller.signal.aborted).toBe(false);
      expect(f.track.stop).toHaveBeenCalledOnce();
      expect(f.room.disconnect).toHaveBeenCalledOnce();
      expect(f.cancel).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });
  it('does not capture disabled sources', async () => {
    const f = setup();
    await connectSessionWithTracks(f.room, f.connect, {}, f.controller.signal);
    expect(f.connect).toHaveBeenCalledWith(expect.any(Function));
    expect(f.prepare).not.toHaveBeenCalled();
    expect(f.capture).not.toHaveBeenCalled();
  });
  it('retains ordinary publication on older SDKs', async () => {
    const f = setup();
    Object.defineProperty(f.room, Symbol.for('livekit.internal.sessionPublication.v1'), {
      value: undefined,
    });
    const microphone = vi
      .spyOn(f.room.localParticipant, 'setMicrophoneEnabled')
      .mockResolvedValue(undefined);
    await connectSessionWithTracks(
      f.room,
      f.connect,
      { microphone: { enabled: true } },
      f.controller.signal,
    );
    expect(f.connect).toHaveBeenCalledWith(expect.any(Function));
    expect(microphone).toHaveBeenCalledWith(true, undefined, {});
    expect(f.capture).not.toHaveBeenCalled();
  });
  it('uses ordinary publication when the supplied room is already connected', async () => {
    const f = setup();
    f.room.state = ConnectionState.Connected;
    const microphone = vi
      .spyOn(f.room.localParticipant, 'setMicrophoneEnabled')
      .mockResolvedValue(undefined);
    await connectSessionWithTracks(
      f.room,
      f.connect,
      { microphone: { enabled: true } },
      f.controller.signal,
    );
    expect(f.prepare).not.toHaveBeenCalled();
    expect(microphone).toHaveBeenCalledWith(true, undefined, {});
  });
  it('rejects an already aborted start without joining or capturing', async () => {
    const f = setup();
    f.controller.abort();
    await expect(
      connectSessionWithTracks(f.room, f.connect, {}, f.controller.signal),
    ).rejects.toThrow();
    expect(f.connect).not.toHaveBeenCalled();
    expect(f.capture).not.toHaveBeenCalled();
  });
});
