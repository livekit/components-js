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
    // And the hook must surface that device as active (Fixes #1472).
    expect(result.current.activeDeviceId).toBe('mic-2');
  });
});

describe('useMediaDeviceSelect in room mode', () => {
  test('emits activeDeviceId only once per room device switch', async () => {
    // Track room event listeners and their emissions.
    type RoomListener = (...args: unknown[]) => void;
    const eventListeners = new Map<string, Set<RoomListener>>();
    const activeDeviceChangedEmissions: string[] = [];

    const on = vi.fn((event: string, listener: RoomListener) => {
      if (!eventListeners.has(event)) eventListeners.set(event, new Set());
      eventListeners.get(event)!.add(listener);
    });
    const off = vi.fn((event: string, listener: RoomListener) => {
      eventListeners.get(event)?.delete(listener);
    });

    const switchActiveDevice = vi.fn(async (kind: MediaDeviceKind, deviceId: string) => {
      // Simulate the room's ActiveDeviceChanged event that switchActiveDevice triggers.
      // The event string is 'activeDeviceChanged' (camelCase).
      const listeners = eventListeners.get('activeDeviceChanged') || new Set();
      listeners.forEach((listener) => {
        activeDeviceChangedEmissions.push(deviceId);
        listener(kind, deviceId);
      });
    });

    const getActiveDevice = vi.fn().mockReturnValue('mic-3');

    const mockRoom = {
      switchActiveDevice,
      getActiveDevice,
      on,
      off,
      localParticipant: {
        getTrackPublication: () => ({
          track: { mediaStreamTrack: { label: 'Microphone 3' } },
        }),
      },
    } as unknown as Parameters<typeof useMediaDeviceSelect>[0]['room'];

    // Room mode: provide a room but no track.
    const { result } = renderHook(() =>
      useMediaDeviceSelect({ kind: 'audioinput', room: mockRoom }),
    );

    // Wait for initial setup and subscription.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Clear any initial emissions.
    activeDeviceChangedEmissions.length = 0;

    await act(async () => {
      await result.current.setActiveMediaDevice('mic-3');
    });

    // In room mode the only way to switch the device is via room.switchActiveDevice.
    expect(switchActiveDevice).toHaveBeenCalledWith('audioinput', 'mic-3', undefined);
    // The hook must surface that device as active from the room event.
    expect(result.current.activeDeviceId).toBe('mic-3');
    // Room mode should emit ActiveDeviceChanged exactly once, not twice.
    // (The fix ensures activeDeviceSubject is not merged in room-only mode.)
    expect(activeDeviceChangedEmissions).toEqual(['mic-3']);
  });
});
