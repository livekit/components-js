import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAgentAudioVisualizerBarAnimator } from '@/hooks/agents-ui/use-agent-audio-visualizer-bar';
import type { AgentState } from '@livekit/components-react';

describe('useAgentAudioVisualizerBarAnimator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Basic Functionality', () => {
    it('returns an array', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerBarAnimator('connecting', 5, 100));
      expect(Array.isArray(result.current)).toBe(true);
    });

    it('returns correct number of columns for speaking state', () => {
      const columns = 5;
      const { result } = renderHook(() =>
        useAgentAudioVisualizerBarAnimator('speaking', columns, 100),
      );
      expect(result.current.length).toBe(columns);
    });

    it('handles different column counts', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerBarAnimator('speaking', 7, 100));
      expect(result.current.length).toBe(7);
    });
  });

  describe('State-based Sequences', () => {
    it('generates sequence for connecting state', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerBarAnimator('connecting', 5, 100));
      expect(result.current).toBeDefined();
      expect(Array.isArray(result.current)).toBe(true);
    });

    it('generates sequence for initializing state', () => {
      const { result } = renderHook(() =>
        useAgentAudioVisualizerBarAnimator('initializing', 5, 100),
      );
      expect(result.current).toBeDefined();
      expect(Array.isArray(result.current)).toBe(true);
    });

    it('generates sequence for thinking state', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerBarAnimator('thinking', 5, 100));
      expect(result.current).toBeDefined();
    });

    it('generates sequence for listening state', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerBarAnimator('listening', 5, 100));
      expect(result.current).toBeDefined();
    });

    it('generates sequence for speaking state', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerBarAnimator('speaking', 5, 100));
      expect(result.current).toBeDefined();
      expect(result.current.length).toBe(5);
    });

    it('handles undefined state', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerBarAnimator(undefined, 5, 100));
      expect(result.current).toBeDefined();
      expect(result.current.length).toBe(5);
    });
  });

  describe('Animation Behavior', () => {
    it('resets index when state changes', () => {
      const { result, rerender } = renderHook(
        ({ state, columns, interval }) =>
          useAgentAudioVisualizerBarAnimator(state, columns, interval),
        { initialProps: { state: 'connecting' as AgentState, columns: 5, interval: 100 } },
      );

      const initial = result.current;

      rerender({ state: 'listening', columns: 5, interval: 100 });

      // After state change, sequence should reflect the new state
      // and may differ from the initial sequence
      expect(result.current).toBeDefined();
      expect(Array.isArray(result.current)).toBe(true);
      // Verify listening state produces different sequence than connecting
      expect(result.current).not.toEqual(initial);
    });

    it('resets index when columns change', () => {
      const { result, rerender } = renderHook(
        ({ state, columns, interval }) =>
          useAgentAudioVisualizerBarAnimator(state, columns, interval),
        { initialProps: { state: 'speaking' as const, columns: 5, interval: 100 } },
      );

      expect(result.current.length).toBe(5);

      rerender({ state: 'speaking' as const, columns: 7, interval: 100 });

      expect(result.current.length).toBe(7);
    });
  });

  describe('Sequence Generation', () => {
    it('generates valid indices for connecting state', () => {
      const columns = 3;
      const { result } = renderHook(() =>
        useAgentAudioVisualizerBarAnimator('connecting', columns, 100),
      );

      result.current.forEach((index) => {
        expect(index).toBeGreaterThanOrEqual(0);
        expect(index).toBeLessThan(columns);
      });
    });

    it('speaking state includes all column indices', () => {
      const columns = 5;
      const { result } = renderHook(() =>
        useAgentAudioVisualizerBarAnimator('speaking', columns, 100),
      );

      expect(result.current).toHaveLength(columns);
      expect(result.current).toEqual([0, 1, 2, 3, 4]);
    });

    it('generates center index for listening state', () => {
      const columns = 5;
      const { result } = renderHook(() =>
        useAgentAudioVisualizerBarAnimator('listening', columns, 100),
      );

      expect(result.current).toBeDefined();
      // Listening state should have center index
      const centerIndex = Math.floor(columns / 2);
      expect(result.current[0]).toBe(centerIndex);
    });
  });

  describe('Return Value Validation', () => {
    it('never returns NaN values', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerBarAnimator('speaking', 5, 100));

      result.current.forEach((value) => {
        expect(Number.isNaN(value)).toBe(false);
      });
    });

    it('returns empty array for disconnected state', () => {
      const { result } = renderHook(() =>
        useAgentAudioVisualizerBarAnimator('disconnected', 5, 100),
      );

      expect(result.current).toEqual([]);
    });

    it('returns array with valid indices', () => {
      const columns = 5;
      const { result } = renderHook(() =>
        useAgentAudioVisualizerBarAnimator('speaking', columns, 100),
      );

      result.current.forEach((index) => {
        expect(typeof index).toBe('number');
        expect(index).toBeGreaterThanOrEqual(0);
        expect(index).toBeLessThan(columns);
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles single column', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerBarAnimator('speaking', 1, 100));

      expect(result.current).toHaveLength(1);
      expect(result.current[0]).toBe(0);
    });

    it('handles large number of columns', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerBarAnimator('speaking', 100, 100));

      expect(result.current).toHaveLength(100);
    });

    it('handles zero interval', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerBarAnimator('speaking', 5, 0));

      expect(result.current).toBeDefined();
    });
  });

  describe('Hook Stability', () => {
    it('does not cause infinite re-renders', () => {
      const { result } = renderHook(() => useAgentAudioVisualizerBarAnimator('speaking', 5, 100));

      expect(result.current).toBeDefined();
    });

    it('maintains sequence structure across re-renders', () => {
      const { result, rerender } = renderHook(
        ({ state, columns, interval }) =>
          useAgentAudioVisualizerBarAnimator(state, columns, interval),
        { initialProps: { state: 'speaking' as const, columns: 5, interval: 100 } },
      );

      const firstResult = result.current;

      rerender({ state: 'speaking' as const, columns: 5, interval: 100 });

      expect(result.current).toEqual(firstResult);
    });
  });
});
