import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { type ComponentProps, type ReactElement } from 'react';
import { renderHook } from '@testing-library/react';
import { useAgentAudioVisualizerGridAnimator } from '@/hooks/agents-ui/use-agent-audio-visualizer-grid';
import { type AgentAudioVisualizerBarProps } from '@/components/agents-ui/agent-audio-visualizer-bar';

describe('useAgentAudioVisualizerGridAnimator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Basic Functionality', () => {
    it('returns a coordinate object', () => {
      const { result } = renderHook(() =>
        useAgentAudioVisualizerGridAnimator('connecting', 5, 5, 100),
      );
      expect(result.current).toHaveProperty('x');
      expect(result.current).toHaveProperty('y');
    });

    it('returns valid coordinates', () => {
      const rows = 5;
      const columns = 5;
      const { result } = renderHook(() =>
        useAgentAudioVisualizerGridAnimator('connecting', rows, columns, 100),
      );

      expect(result.current.x).toBeGreaterThanOrEqual(0);
      expect(result.current.x).toBeLessThan(columns);
      expect(result.current.y).toBeGreaterThanOrEqual(0);
      expect(result.current.y).toBeLessThan(rows);
    });
  });

  describe('State-based Sequences', () => {
    it('handles thinking state', () => {
      const { result } = renderHook(() =>
        useAgentAudioVisualizerGridAnimator('thinking', 5, 5, 100),
      );
      expect(result.current).toBeDefined();
    });

    it('handles connecting state', () => {
      const { result } = renderHook(() =>
        useAgentAudioVisualizerGridAnimator('connecting', 5, 5, 100),
      );
      expect(result.current).toBeDefined();
    });

    it('handles initializing state', () => {
      const { result } = renderHook(() =>
        useAgentAudioVisualizerGridAnimator('initializing', 5, 5, 100),
      );
      expect(result.current).toBeDefined();
    });

    it('handles listening state', () => {
      const { result } = renderHook(() =>
        useAgentAudioVisualizerGridAnimator('listening', 5, 5, 100),
      );
      expect(result.current).toBeDefined();
    });

    it('handles speaking state', () => {
      const { result } = renderHook(() =>
        useAgentAudioVisualizerGridAnimator('speaking', 5, 5, 100),
      );
      expect(result.current).toBeDefined();
    });
  });

  describe('Grid Dimensions', () => {
    it('respects row count', () => {
      const rows = 3;
      const columns = 3;
      const { result } = renderHook(() =>
        useAgentAudioVisualizerGridAnimator('connecting', rows, columns, 100),
      );

      expect(result.current.y).toBeLessThan(rows);
    });

    it('respects column count', () => {
      const rows = 3;
      const columns = 4;
      const { result } = renderHook(() =>
        useAgentAudioVisualizerGridAnimator('connecting', rows, columns, 100),
      );

      expect(result.current.x).toBeLessThan(columns);
    });

    it('handles different grid sizes', () => {
      const { result } = renderHook(() =>
        useAgentAudioVisualizerGridAnimator('connecting', 7, 8, 100),
      );

      expect(result.current.x).toBeGreaterThanOrEqual(0);
      expect(result.current.x).toBeLessThan(8);
      expect(result.current.y).toBeGreaterThanOrEqual(0);
      expect(result.current.y).toBeLessThan(7);
    });
  });

  describe('Radius Parameter', () => {
    it('accepts radius parameter', () => {
      const { result } = renderHook(() =>
        useAgentAudioVisualizerGridAnimator('connecting', 5, 5, 100, 2),
      );
      expect(result.current).toBeDefined();
    });

    it('works without radius parameter', () => {
      const { result } = renderHook(() =>
        useAgentAudioVisualizerGridAnimator('connecting', 5, 5, 100),
      );
      expect(result.current).toBeDefined();
    });
  });

  describe('Return Value Validation', () => {
    it('never returns NaN values', () => {
      const { result } = renderHook(() =>
        useAgentAudioVisualizerGridAnimator('speaking', 5, 5, 100),
      );

      expect(Number.isNaN(result.current.x)).toBe(false);
      expect(Number.isNaN(result.current.y)).toBe(false);
    });

    it('returns center for speaking state', () => {
      const rows = 5;
      const columns = 5;
      const { result } = renderHook(() =>
        useAgentAudioVisualizerGridAnimator('speaking', rows, columns, 100),
      );

      expect(result.current.x).toBe(Math.floor(columns / 2));
      expect(result.current.y).toBe(Math.floor(rows / 2));
    });
  });

  describe('Edge Cases', () => {
    it('handles 1x1 grid', () => {
      const { result } = renderHook(() =>
        useAgentAudioVisualizerGridAnimator('connecting', 1, 1, 100),
      );

      expect(result.current.x).toBe(0);
      expect(result.current.y).toBe(0);
    });

    it('handles large grid', () => {
      const { result } = renderHook(() =>
        useAgentAudioVisualizerGridAnimator('connecting', 20, 20, 100),
      );

      expect(result.current.x).toBeGreaterThanOrEqual(0);
      expect(result.current.x).toBeLessThan(20);
      expect(result.current.y).toBeGreaterThanOrEqual(0);
      expect(result.current.y).toBeLessThan(20);
    });
  });

  describe('Hook Stability', () => {
    it('does not cause infinite re-renders', () => {
      const { result } = renderHook(() =>
        useAgentAudioVisualizerGridAnimator('speaking', 5, 5, 100),
      );

      expect(result.current).toBeDefined();
    });

    it('maintains coordinate structure', () => {
      const { result } = renderHook(() =>
        useAgentAudioVisualizerGridAnimator('connecting', 5, 5, 100),
      );

      expect(result.current).toMatchObject({
        x: expect.any(Number),
        y: expect.any(Number),
      });
    });
  });
});

describe('AgentAudioVisualizerBar children typing', () => {
  it('accepts a single div element', () => {
    const singleDivChild = null as unknown as ReactElement<ComponentProps<'div'>, 'div'>;
    const props: AgentAudioVisualizerBarProps = { children: singleDivChild };

    expect(props.children).toBe(singleDivChild);
  });
});
