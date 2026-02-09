import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAgentAudioVisualizerAura } from '@/hooks/agents-ui/use-agent-audio-visualizer-aura';
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

describe('useAgentAudioVisualizerAura', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(LiveKitComponents.useTrackVolume).mockReturnValue(0);
  });

  describe('Basic Hook Behavior', () => {
    it('returns default values', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerAura(undefined));

      expect(result.current).toHaveProperty('speed');
      expect(result.current).toHaveProperty('scale');
      expect(result.current).toHaveProperty('amplitude');
      expect(result.current).toHaveProperty('frequency');
      expect(result.current).toHaveProperty('brightness');
    });

    it('returns numeric values', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerAura('idle'));

      expect(typeof result.current.speed).toBe('number');
      expect(typeof result.current.scale).toBe('number');
      expect(typeof result.current.amplitude).toBe('number');
      expect(typeof result.current.frequency).toBe('number');
      expect(typeof result.current.brightness).toBe('number');
    });
  });

  describe('State-based Animation Values', () => {
    it('handles idle state', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerAura('idle'));
      expect(result.current.speed).toBe(10);
    });

    it('handles failed state', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerAura('failed'));
      expect(result.current.speed).toBe(10);
    });

    it('handles disconnected state', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerAura('disconnected'));
      expect(result.current.speed).toBe(10);
    });

    it('handles listening state', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerAura('listening'));
      expect(result.current.speed).toBe(20);
    });

    it('handles pre-connect-buffering state', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerAura('pre-connect-buffering'));
      expect(result.current.speed).toBe(20);
    });

    it('handles thinking state', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerAura('thinking'));
      expect(result.current.speed).toBe(30);
    });

    it('handles connecting state', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerAura('connecting'));
      expect(result.current.speed).toBe(30);
    });

    it('handles initializing state', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerAura('initializing'));
      expect(result.current.speed).toBe(30);
    });

    it('handles speaking state', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerAura('speaking'));
      expect(result.current.speed).toBe(70);
    });
  });

  describe('Audio Track Integration', () => {
    it('works without audio track', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerAura('speaking'));

      expect(result.current).toBeDefined();
      expect(LiveKitComponents.useTrackVolume).toHaveBeenCalled();
    });

    it('accepts audio track parameter', () => {
      const mockTrack = {} as any;
      const { result } = renderHook(() => useAgentAudioVisualizerAura('speaking', mockTrack));

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

      const { result } = renderHook(() => useAgentAudioVisualizerAura('speaking', mockTrack));

      expect(result.current).toBeDefined();
    });
  });

  describe('State Transitions', () => {
    it('updates values when state changes', async () => {
      const { result, rerender } = renderHook(({ state }) => useAgentAudioVisualizerAura(state), {
        initialProps: { state: 'idle' as AgentState },
      });

      const initialSpeed = result.current.speed;
      expect(initialSpeed).toBe(10);

      rerender({ state: 'speaking' as AgentState });

      await waitFor(() => {
        expect(result.current.speed).toBe(70);
      });
    });

    it('handles undefined state', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerAura(undefined));
      expect(result.current).toBeDefined();
    });

    it('transitions from listening to speaking', async () => {
      const { result, rerender } = renderHook(({ state }) => useAgentAudioVisualizerAura(state), {
        initialProps: { state: 'listening' as AgentState },
      });

      expect(result.current.speed).toBe(20);

      rerender({ state: 'speaking' as AgentState });

      await waitFor(() => {
        expect(result.current.speed).toBe(70);
      });
    });
  });

  describe('Return Value Properties', () => {
    it('speed is always a positive number', () => {
      const states = ['idle', 'connecting', 'listening', 'thinking', 'speaking'] as const;

      states.forEach((state) => {
        const { result } = renderHook(() => useAgentAudioVisualizerAura(state));
        expect(result.current.speed).toBeGreaterThan(0);
      });
    });

    it('all values are defined', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerAura('speaking'));

      expect(result.current.speed).toBeDefined();
      expect(result.current.scale).toBeDefined();
      expect(result.current.amplitude).toBeDefined();
      expect(result.current.frequency).toBeDefined();
      expect(result.current.brightness).toBeDefined();
    });

    it('values are not NaN', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerAura('speaking'));

      expect(Number.isNaN(result.current.speed)).toBe(false);
      expect(Number.isNaN(result.current.scale)).toBe(false);
      expect(Number.isNaN(result.current.amplitude)).toBe(false);
      expect(Number.isNaN(result.current.frequency)).toBe(false);
      expect(Number.isNaN(result.current.brightness)).toBe(false);
    });
  });

  describe('Hook Stability', () => {
    it('returns stable values for same state', () => {
      const { result, rerender } = renderHook(({ state }) => useAgentAudioVisualizerAura(state), {
        initialProps: { state: 'idle' as const },
      });

      const firstSpeed = result.current.speed;
      rerender({ state: 'idle' as const });

      expect(result.current.speed).toBe(firstSpeed);
    });

    it('does not cause infinite re-renders', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerAura('speaking'));

      // If this test completes without timeout, the hook is stable
      expect(result.current).toBeDefined();
    });
  });
});
