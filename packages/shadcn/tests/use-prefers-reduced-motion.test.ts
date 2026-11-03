import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { usePrefersReducedMotion } from '@/hooks/agents-ui/use-prefers-reduced-motion';
import { useAgentAudioVisualizerBarAnimator } from '@/hooks/agents-ui/use-agent-audio-visualizer-bar';
import { useAgentAudioVisualizerRadialAnimator } from '@/hooks/agents-ui/use-agent-audio-visualizer-radial';
import { useAgentAudioVisualizerGridAnimator } from '@/hooks/agents-ui/use-agent-audio-visualizer-grid';

function mockReducedMotion(initial: boolean) {
  let matches = initial;
  const listeners = new Set<() => void>();
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      get matches() {
        return query === '(prefers-reduced-motion: reduce)' && matches;
      },
      media: query,
      addEventListener: (_: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
    })),
  );
  return (next: boolean) => {
    matches = next;
    listeners.forEach((listener) => listener());
  };
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('usePrefersReducedMotion', () => {
  it('is false without matchMedia', () => {
    vi.stubGlobal('matchMedia', undefined);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
  });

  it('follows the system setting as it changes', () => {
    const setReducedMotion = mockReducedMotion(false);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);

    act(() => setReducedMotion(true));
    expect(result.current).toBe(true);
  });
});

describe('visualizer sequences with reduced motion', () => {
  it('steps through the bar sequence normally', () => {
    mockReducedMotion(false);
    vi.useFakeTimers();
    const { result } = renderHook(() => useAgentAudioVisualizerBarAnimator('connecting', 5, 100));
    const first = result.current;

    act(() => vi.advanceTimersByTime(250));
    expect(result.current).not.toEqual(first);
  });

  it('holds the first bar frame', () => {
    mockReducedMotion(true);
    vi.useFakeTimers();
    const { result } = renderHook(() => useAgentAudioVisualizerBarAnimator('connecting', 5, 100));

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current).toEqual([0, 4]);
  });

  it('holds the first radial frame', () => {
    mockReducedMotion(true);
    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useAgentAudioVisualizerRadialAnimator('connecting', 24, 100),
    );
    const first = result.current;

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current).toEqual(first);
  });

  it('holds the first grid frame', () => {
    mockReducedMotion(true);
    vi.useFakeTimers();
    const { result } = renderHook(() => useAgentAudioVisualizerGridAnimator('thinking', 5, 5, 100));
    const first = result.current;

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current).toEqual(first);
  });

  it('starts stepping again when reduced motion turns off', () => {
    const setReducedMotion = mockReducedMotion(true);
    vi.useFakeTimers();
    const { result } = renderHook(() => useAgentAudioVisualizerBarAnimator('connecting', 5, 100));

    act(() => setReducedMotion(false));
    act(() => vi.advanceTimersByTime(250));
    expect(result.current).not.toEqual([0, 4]);
  });
});
