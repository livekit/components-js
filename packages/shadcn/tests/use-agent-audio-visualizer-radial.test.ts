import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAgentAudioVisualizerRadialAnimator } from '@/hooks/agents-ui/use-agent-audio-visualizer-radial';
import type { AgentState } from '@livekit/components-react';

describe('useAgentAudioVisualizerRadialAnimator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Basic Functionality', () => {
    it('returns an array', () => {
      const { result } = renderHook(() =>
        useAgentAudioVisualizerRadialAnimator('connecting', 12, 100),
      );
      expect(Array.isArray(result.current)).toBe(true);
    });

    it('returns valid indices', () => {
      const barCount = 12;
      const { result } = renderHook(() =>
        useAgentAudioVisualizerRadialAnimator('connecting', barCount, 100),
      );

      result.current.forEach((index) => {
        expect(index).toBeGreaterThanOrEqual(0);
        expect(index).toBeLessThan(barCount);
      });
    });
  });

  describe('State-based Sequences', () => {
    it('handles thinking state', () => {
      const { result } = renderHook(() =>
        useAgentAudioVisualizerRadialAnimator('thinking', 12, 100),
      );
      expect(result.current).toBeDefined();
      expect(Array.isArray(result.current)).toBe(true);
    });

    it('handles connecting state', () => {
      const { result } = renderHook(() =>
        useAgentAudioVisualizerRadialAnimator('connecting', 12, 100),
      );
      expect(result.current).toBeDefined();
    });

    it('handles initializing state', () => {
      const { result } = renderHook(() =>
        useAgentAudioVisualizerRadialAnimator('initializing', 12, 100),
      );
      expect(result.current).toBeDefined();
    });

    it('handles listening state', () => {
      const { result } = renderHook(() =>
        useAgentAudioVisualizerRadialAnimator('listening', 12, 100),
      );
      expect(result.current).toBeDefined();
    });

    it('handles speaking state', () => {
      const barCount = 12;
      const { result } = renderHook(() =>
        useAgentAudioVisualizerRadialAnimator('speaking', barCount, 100),
      );
      expect(result.current.length).toBe(barCount);
    });

    it('handles undefined state', () => {
      const barCount = 12;
      const { result } = renderHook(() =>
        useAgentAudioVisualizerRadialAnimator(undefined, barCount, 100),
      );
      expect(result.current.length).toBe(barCount);
    });
  });

  describe('Bar Count', () => {
    it('handles different bar counts', () => {
      const barCount = 16;
      const { result } = renderHook(() =>
        useAgentAudioVisualizerRadialAnimator('speaking', barCount, 100),
      );
      expect(result.current.length).toBe(barCount);
    });

    it('speaking state includes all bars', () => {
      const barCount = 8;
      const { result } = renderHook(() =>
        useAgentAudioVisualizerRadialAnimator('speaking', barCount, 100),
      );
      expect(result.current).toHaveLength(barCount);
      expect(result.current).toEqual(Array.from({ length: barCount }, (_, i) => i));
    });
  });

  describe('Return Value Validation', () => {
    it('never returns NaN values', () => {
      const { result } = renderHook(() =>
        useAgentAudioVisualizerRadialAnimator('speaking', 12, 100),
      );

      result.current.forEach((value) => {
        expect(Number.isNaN(value)).toBe(false);
      });
    });

    it('returns empty array for disconnected state', () => {
      const { result } = renderHook(() =>
        useAgentAudioVisualizerRadialAnimator('disconnected', 12, 100),
      );
      expect(result.current).toEqual([]);
    });

    it('all values are within barCount range', () => {
      const barCount = 12;
      const { result } = renderHook(() =>
        useAgentAudioVisualizerRadialAnimator('speaking', barCount, 100),
      );

      result.current.forEach((index) => {
        expect(index).toBeGreaterThanOrEqual(0);
        expect(index).toBeLessThan(barCount);
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles single bar', () => {
      const { result } = renderHook(() =>
        useAgentAudioVisualizerRadialAnimator('speaking', 1, 100),
      );
      expect(result.current).toHaveLength(1);
      expect(result.current[0]).toBe(0);
    });

    it('handles large number of bars', () => {
      const barCount = 48;
      const { result } = renderHook(() =>
        useAgentAudioVisualizerRadialAnimator('speaking', barCount, 100),
      );
      expect(result.current).toHaveLength(barCount);
    });

    it('handles zero interval', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerRadialAnimator('speaking', 12, 0));
      expect(result.current).toBeDefined();
    });
  });

  describe('State Transitions', () => {
    it('resets index when state changes', async () => {
      const barCount = 12;
      const { result, rerender } = renderHook(
        ({ state, barCount, interval }) =>
          useAgentAudioVisualizerRadialAnimator(state, barCount, interval),
        { initialProps: { state: 'connecting' as AgentState, barCount, interval: 100 } },
      );

      const initialSequence = result.current;

      rerender({ state: 'listening' as AgentState, barCount, interval: 100 });

      const divisor = barCount / 4;
      const expectedSequence = Array.from({ length: Math.floor(barCount / divisor) }, (_, idx) => idx * divisor);
      expect(result.current).toEqual(expectedSequence);
      expect(result.current).not.toEqual(initialSequence);
    });
  });

  describe('Hook Stability', () => {
    it('does not cause infinite re-renders', () => {
      const { result } = renderHook(() =>
        useAgentAudioVisualizerRadialAnimator('speaking', 12, 100),
      );
      expect(result.current).toBeDefined();
    });

    it('maintains array structure', () => {
      const { result } = renderHook(() =>
        useAgentAudioVisualizerRadialAnimator('connecting', 12, 100),
      );
      expect(Array.isArray(result.current)).toBe(true);
    });
  });
});
