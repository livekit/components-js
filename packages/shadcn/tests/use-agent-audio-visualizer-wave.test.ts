import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAgentAudioVisualizerWave } from '@/hooks/agents-ui/use-agent-audio-visualizer-wave';
import type { AgentState } from '@livekit/components-react';
import * as LiveKitComponents from '@livekit/components-react';

// Mock dependencies
vi.mock('@livekit/components-react', async () => {
  const actual = await vi.importActual('@livekit/components-react');
  return {
    ...actual,
    useTrackVolume: vi.fn(() => 0),
  };
});

vi.mock('motion/react', () => ({
  useMotionValue: vi.fn((initial) => ({
    get: () => initial,
    set: vi.fn(),
  })),
  useMotionValueEvent: vi.fn(),
  animate: vi.fn(() => {
    const promise = Promise.resolve();
    (promise as typeof promise & { stop?: () => void }).stop = vi.fn();
    return promise;
  }),
}));

describe('useAgentAudioVisualizerWave', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('returns wave properties', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerWave({}));

      expect(result.current).toHaveProperty('speed');
      expect(result.current).toHaveProperty('amplitude');
      expect(result.current).toHaveProperty('frequency');
      expect(result.current).toHaveProperty('opacity');
    });

    it('returns numeric values', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerWave({ state: 'speaking' }));

      expect(typeof result.current.speed).toBe('number');
      expect(typeof result.current.amplitude).toBe('number');
      expect(typeof result.current.frequency).toBe('number');
      expect(typeof result.current.opacity).toBe('number');
    });
  });

  describe('State-based Animation', () => {
    it('handles disconnected state', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerWave({ state: 'disconnected' }));
      expect(result.current.speed).toBeDefined();
    });

    it('handles listening state', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerWave({ state: 'listening' }));
      expect(result.current.speed).toBeDefined();
    });

    it('handles thinking state', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerWave({ state: 'thinking' }));
      expect(result.current.speed).toBeGreaterThan(0);
    });

    it('handles connecting state', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerWave({ state: 'connecting' }));
      expect(result.current.speed).toBeGreaterThan(0);
    });

    it('handles initializing state', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerWave({ state: 'initializing' }));
      expect(result.current.speed).toBeGreaterThan(0);
    });

    it('handles speaking state', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerWave({ state: 'speaking' }));
      expect(result.current.speed).toBeGreaterThan(0);
    });

    it('handles undefined state', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerWave({}));
      expect(result.current.speed).toBeGreaterThan(0);
    });
  });

  describe('Audio Track Integration', () => {
    it('works without audio track', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerWave({ state: 'speaking' }));
      expect(result.current).toBeDefined();
    });

    it('accepts audio track parameter', () => {
      const mockTrack = {} as any;
      const { result } = renderHook(() =>
        useAgentAudioVisualizerWave({ state: 'speaking', audioTrack: mockTrack }),
      );
      expect(result.current).toBeDefined();
      expect(LiveKitComponents.useTrackVolume).toHaveBeenCalled();
    });

    it('uses track volume in speaking state', () => {
      vi.mocked(LiveKitComponents.useTrackVolume).mockReturnValue(0.7);
      const mockTrack = {} as any;

      const { result } = renderHook(() =>
        useAgentAudioVisualizerWave({ state: 'speaking', audioTrack: mockTrack }),
      );

      expect(result.current).toBeDefined();
    });
  });

  describe('State Transitions', () => {
    it('updates values when state changes', async () => {
      const { result, rerender } = renderHook(
        ({ state }) => useAgentAudioVisualizerWave({ state }),
        { initialProps: { state: 'listening' as AgentState } },
      );

      const initialSpeed = result.current.speed;

      rerender({ state: 'speaking' as AgentState });

      await waitFor(() => {
        expect(result.current.speed).toBeDefined();
        expect(result.current.speed).not.toBe(initialSpeed);
      });
    });
  });

  describe('Return Value Validation', () => {
    it('all values are not NaN', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerWave({ state: 'speaking' }));

      expect(Number.isNaN(result.current.speed)).toBe(false);
      expect(Number.isNaN(result.current.amplitude)).toBe(false);
      expect(Number.isNaN(result.current.frequency)).toBe(false);
      expect(Number.isNaN(result.current.opacity)).toBe(false);
    });

    it('speed is always positive', () => {
      const states = ['disconnected', 'listening', 'thinking', 'speaking'] as const;

      states.forEach((state) => {
        const { result } = renderHook(() => useAgentAudioVisualizerWave({ state }));
        expect(result.current.speed).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Hook Stability', () => {
    it('returns stable values for same state', () => {
      const { result, rerender } = renderHook(
        ({ state }) => useAgentAudioVisualizerWave({ state }),
        { initialProps: { state: 'listening' as const } },
      );

      const firstSpeed = result.current.speed;
      rerender({ state: 'listening' as const });

      expect(result.current.speed).toBe(firstSpeed);
    });
  });
});
