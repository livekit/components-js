import { EventEmitter } from 'events';
import { RoomEvent, TrackEvent, type LocalAudioTrack, type Room } from 'livekit-client';
import { describe, it, expect, vi } from 'vitest';
import { setupDeviceSelector } from './mediaDeviceSelect';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function fakeRoom() {
  return Object.assign(new EventEmitter(), {
    switchActiveDevice: vi.fn().mockResolvedValue(true),
    getActiveDevice: vi.fn().mockReturnValue('mic-2'),
    localParticipant: { getTrackPublication: () => undefined },
  });
}

function fakeTrack(deviceId: string, label = 'Built-in Microphone') {
  const track = Object.assign(new EventEmitter(), {
    mediaStreamTrack: { label },
    getDeviceId: vi.fn().mockResolvedValue(deviceId),
    setDeviceId: vi.fn(async (id: string) => {
      track.emit(TrackEvent.Restarted, track);
      return id;
    }),
  });
  return track;
}

function record(...args: Parameters<typeof setupDeviceSelector>) {
  const selector = setupDeviceSelector(...args);
  const emitted: (string | undefined)[] = [];
  selector.activeDeviceObservable.subscribe((id) => emitted.push(id));
  return { ...selector, emitted };
}

describe('setupDeviceSelector', () => {
  it('follows room device changes of its own kind and setActiveMediaDevice', async () => {
    const room = fakeRoom();
    const { emitted, setActiveMediaDevice } = record('audioinput', room as unknown as Room);

    room.emit(RoomEvent.ActiveDeviceChanged, 'audioinput', 'mic-1');
    room.emit(RoomEvent.ActiveDeviceChanged, 'videoinput', 'cam-1');
    await setActiveMediaDevice('mic-2');

    expect(room.switchActiveDevice).toHaveBeenCalledWith('audioinput', 'mic-2', undefined);
    expect(emitted).toEqual([undefined, 'mic-1', 'mic-2']);
  });

  it('follows the local track device across restarts', async () => {
    const track = fakeTrack('mic-1');
    const { emitted } = record(
      'audioinput',
      fakeRoom() as unknown as Room,
      track as unknown as LocalAudioTrack,
    );
    await flush();

    track.getDeviceId.mockResolvedValue('mic-2');
    track.emit(TrackEvent.Restarted, track);
    await flush();

    expect(emitted).toEqual([undefined, 'mic-1', 'mic-2']);
  });

  it("keeps 'default' when the track is on the default device", async () => {
    const track = fakeTrack('mic-1', 'Default - Built-in Microphone');
    const { emitted, setActiveMediaDevice } = record(
      'audioinput',
      fakeRoom() as unknown as Room,
      track as unknown as LocalAudioTrack,
    );
    await flush();

    await setActiveMediaDevice('default');
    await flush();

    expect(track.setDeviceId).toHaveBeenCalledWith('default');
    expect(emitted.at(-1)).toBe('default');
  });
});
