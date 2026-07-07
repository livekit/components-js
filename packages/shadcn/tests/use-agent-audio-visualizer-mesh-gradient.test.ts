import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAgentAudioVisualizerMeshGradient } from '@/hooks/agents-ui/use-agent-audio-visualizer-mesh-gradient';
import type { AgentState } from '@livekit/components-react';
import * as LiveKitComponents from '@livekit/components-react';

// Mock the @livekit/components-react hooks
vi.mock('@livekit/components-react', async () => {
  const actual = await vi.importActual('@livekit/components-react');
  return {
    ...actual,
    useTrackVolume: vi.fn(() => 0),
  };
});

// Mock motion/react
vi.mock('motion/react', () => ({
  useMotionValue: vi.fn((initial) => ({
    get: () => initial,
    set: vi.fn(),
    isAnimating: () => false,
  })),
  useMotionValueEvent: vi.fn(),
  animate: vi.fn(() => ({
    stop: vi.fn(),
  })),
}));

describe('useAgentAudioVisualizerMeshGradient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(LiveKitComponents.useTrackVolume).mockReturnValue(0);
  });

  describe('Basic Hook Behavior', () => {
    it('returns default values', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerMeshGradient(undefined));

      expect(result.current).toHaveProperty('speed');
      expect(result.current).toHaveProperty('distortion');
      expect(result.current).toHaveProperty('swirl');
    });

    it('returns numeric values', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerMeshGradient('idle'));

      expect(typeof result.current.speed).toBe('number');
      expect(typeof result.current.distortion).toBe('number');
      expect(typeof result.current.swirl).toBe('number');
    });
  });

  describe('State-based Animation Values', () => {
    it('handles idle state', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerMeshGradient('idle'));
      expect(result.current.speed).toBe(0.3);
    });

    it('handles failed state', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerMeshGradient('failed'));
      expect(result.current.speed).toBe(0.3);
    });

    it('handles disconnected state', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerMeshGradient('disconnected'));
      expect(result.current.speed).toBe(0.3);
    });

    it('handles listening state', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerMeshGradient('listening'));
      expect(result.current.speed).toBe(0.7);
    });

    it('handles pre-connect-buffering state', () => {
      const { result } = renderHook(() =>
        useAgentAudioVisualizerMeshGradient('pre-connect-buffering'),
      );
      expect(result.current.speed).toBe(0.7);
    });

    it('handles thinking state', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerMeshGradient('thinking'));
      expect(result.current.speed).toBe(1.1);
    });

    it('handles connecting state', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerMeshGradient('connecting'));
      expect(result.current.speed).toBe(1.1);
    });

    it('handles initializing state', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerMeshGradient('initializing'));
      expect(result.current.speed).toBe(1.1);
    });

    it('handles speaking state', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerMeshGradient('speaking'));
      expect(result.current.speed).toBe(1.0);
    });
  });

  describe('Audio Track Integration', () => {
    it('works without audio track', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerMeshGradient('speaking'));

      expect(result.current).toBeDefined();
      expect(LiveKitComponents.useTrackVolume).toHaveBeenCalled();
    });

    it('accepts audio track parameter', () => {
      const mockTrack = {} as any;
      const { result } = renderHook(() =>
        useAgentAudioVisualizerMeshGradient('speaking', mockTrack),
      );

      expect(result.current).toBeDefined();
      expect(LiveKitComponents.useTrackVolume).toHaveBeenCalledWith(
        mockTrack,
        expect.objectContaining({
          fftSize: 512,
          smoothingTimeConstant: 0.55,
        }),
      );
    });

    it('uses track volume in speaking state', () => {
      vi.mocked(LiveKitComponents.useTrackVolume).mockReturnValue(0.8);
      const mockTrack = {} as any;

      const { result } = renderHook(() =>
        useAgentAudioVisualizerMeshGradient('speaking', mockTrack),
      );

      expect(result.current).toBeDefined();
    });
  });

  describe('State Transitions', () => {
    it('updates values when state changes', async () => {
      const { result, rerender } = renderHook(
        ({ state }) => useAgentAudioVisualizerMeshGradient(state),
        {
          initialProps: { state: 'idle' as AgentState },
        },
      );

      const initialSpeed = result.current.speed;
      expect(initialSpeed).toBe(0.3);

      rerender({ state: 'speaking' as AgentState });

      await waitFor(() => {
        expect(result.current.speed).toBe(1.0);
      });
    });

    it('handles undefined state', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerMeshGradient(undefined));
      expect(result.current).toBeDefined();
    });

    it('transitions from listening to speaking', async () => {
      const { result, rerender } = renderHook(
        ({ state }) => useAgentAudioVisualizerMeshGradient(state),
        {
          initialProps: { state: 'listening' as AgentState },
        },
      );

      expect(result.current.speed).toBe(0.7);

      rerender({ state: 'speaking' as AgentState });

      await waitFor(() => {
        expect(result.current.speed).toBe(1.0);
      });
    });
  });

  describe('Return Value Properties', () => {
    it('all values are defined', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerMeshGradient('speaking'));

      expect(result.current.speed).toBeDefined();
      expect(result.current.distortion).toBeDefined();
      expect(result.current.swirl).toBeDefined();
    });

    it('values are not NaN', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerMeshGradient('speaking'));

      expect(Number.isNaN(result.current.speed)).toBe(false);
      expect(Number.isNaN(result.current.distortion)).toBe(false);
      expect(Number.isNaN(result.current.swirl)).toBe(false);
    });
  });

  describe('Hook Stability', () => {
    it('returns stable values for same state', () => {
      const { result, rerender } = renderHook(
        ({ state }) => useAgentAudioVisualizerMeshGradient(state),
        {
          initialProps: { state: 'idle' as const },
        },
      );

      const firstSpeed = result.current.speed;
      rerender({ state: 'idle' as const });

      expect(result.current.speed).toBe(firstSpeed);
    });

    it('does not cause infinite re-renders', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerMeshGradient('speaking'));

      // If this test completes without timeout, the hook is stable
      expect(result.current).toBeDefined();
    });
  });
});
