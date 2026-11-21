import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAgentAudioVisualizerOrbit } from '@/hooks/agents-ui/use-agent-audio-visualizer-orbit';
import * as LiveKitComponents from '@livekit/components-react';

vi.mock('@livekit/components-react', async () => {
  const actual = await vi.importActual('@livekit/components-react');
  return {
    ...actual,
    useTrackVolume: vi.fn(() => 0),
    useMultibandTrackVolume: vi.fn(() => new Array(7).fill(0)),
  };
});

describe('useAgentAudioVisualizerOrbit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(LiveKitComponents.useTrackVolume).mockReturnValue(0);
    vi.mocked(LiveKitComponents.useMultibandTrackVolume).mockReturnValue(new Array(7).fill(0));
  });

  it('returns bands from useMultibandTrackVolume', () => {
    const bands = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7];
    vi.mocked(LiveKitComponents.useMultibandTrackVolume).mockReturnValue(bands);

    const { result } = renderHook(() => useAgentAudioVisualizerOrbit('speaking'));

    expect(result.current.bands).toBe(bands);
    expect(LiveKitComponents.useMultibandTrackVolume).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({ bands: 7, loPass: 100, hiPass: 200 }),
    );
  });

  it('uses the volume prop instead of track volume', () => {
    vi.mocked(LiveKitComponents.useTrackVolume).mockReturnValue(0.2);

    const { result } = renderHook(() => useAgentAudioVisualizerOrbit('speaking', undefined, 0.9));

    expect(result.current.level).toBe(0.9);
  });

  it('falls back to track volume when volume is not supplied', () => {
    vi.mocked(LiveKitComponents.useTrackVolume).mockReturnValue(0.4);

    const { result } = renderHook(() => useAgentAudioVisualizerOrbit('speaking'));

    expect(result.current.level).toBe(0.4);
  });

  describe('connected', () => {
    it('is false when disconnected', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerOrbit('disconnected'));
      expect(result.current.connected).toBe(false);
    });

    it('is false when state is undefined', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerOrbit(undefined));
      expect(result.current.connected).toBe(false);
    });

    it('is true for any other state', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerOrbit('listening'));
      expect(result.current.connected).toBe(true);
    });
  });

  describe('swirl', () => {
    it('is fastest when thinking', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerOrbit('thinking'));
      expect(result.current.swirl).toBe(3.2);
    });

    it('is moderate when speaking', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerOrbit('speaking'));
      expect(result.current.swirl).toBe(1.4);
    });

    it('is idle otherwise', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerOrbit('listening'));
      expect(result.current.swirl).toBe(0.55);
    });
  });

  describe('breatheFrequency', () => {
    it('is slower when listening', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerOrbit('listening'));
      expect(result.current.breatheFrequency).toBe(1.2);
    });

    it('is slower when pre-connect-buffering', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerOrbit('pre-connect-buffering'));
      expect(result.current.breatheFrequency).toBe(1.2);
    });

    it('is faster otherwise', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerOrbit('speaking'));
      expect(result.current.breatheFrequency).toBe(2.1);
    });
  });
});
