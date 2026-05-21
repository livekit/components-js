import { renderHook, act } from '@testing-library/react';
import type * as ComponentsCore from '@livekit/components-core';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { useMediaDeviceSelect } from './useMediaDeviceSelect';

// Minimal subscribable so we avoid touching navigator.mediaDevices in jsdom.
const noopObserver = { subscribe: () => ({ unsubscribe: () => {} }) };

// Mock only the device enumeration + logging so jsdom does not touch navigator.mediaDevices.
// The real setupDeviceSelector is kept so we exercise the actual track-forwarding behaviour.
vi.mock('@livekit/components-core', async (importOriginal) => {
  const actual = await importOriginal<typeof ComponentsCore>();
  return {
    ...actual,
    createMediaDeviceObserver: () => noopObserver,
    log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
  };
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('useMediaDeviceSelect in preview mode', () => {
  test('forwards the local track so setActiveMediaDevice switches the device', async () => {
    // A preview track as returned by usePreviewTracks / createLocalTracks.
    const setDeviceId = vi.fn().mockResolvedValue(undefined);
    const getDeviceId = vi.fn().mockResolvedValue('mic-2');
    const mockLocalTrack = {
      setDeviceId,
      getDeviceId,
      mediaStreamTrack: { label: 'Fake Microphone 2' },
    } as unknown as Parameters<typeof useMediaDeviceSelect>[0]['track'];

    // No room and no RoomContext => preview mode (roomFallback becomes new Room()).
    const { result } = renderHook(() =>
      useMediaDeviceSelect({ kind: 'audioinput', track: mockLocalTrack }),
    );

    await act(async () => {
      await result.current.setActiveMediaDevice('mic-2');
    });

    // In preview mode the only way to actually switch the device is via the track.
    expect(setDeviceId).toHaveBeenCalledWith('mic-2');
  });
});
