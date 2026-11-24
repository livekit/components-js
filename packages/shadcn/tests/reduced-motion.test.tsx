import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, render, renderHook } from '@testing-library/react';
import { useAgentAudioVisualizerBarAnimator } from '@/hooks/agents-ui/use-agent-audio-visualizer-bar';
import { useAgentAudioVisualizerRadialAnimator } from '@/hooks/agents-ui/use-agent-audio-visualizer-radial';
import { useAgentAudioVisualizerGridAnimator } from '@/hooks/agents-ui/use-agent-audio-visualizer-grid';
import { AgentChatIndicator } from '@/components/agents-ui/agent-chat-indicator';
import type * as MotionReact from 'motion/react';

const reducedMotion = vi.hoisted(() => ({ value: false }));

vi.mock('motion/react', async (importOriginal) => {
  const actual = await importOriginal<typeof MotionReact>();
  return { ...actual, useReducedMotion: () => reducedMotion.value };
});

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe('prefers-reduced-motion', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    reducedMotion.value = false;
    vi.useRealTimers();
  });

  describe.each([
    ['bar', useAgentAudioVisualizerBarAnimator],
    ['radial', useAgentAudioVisualizerRadialAnimator],
  ])('%s animator', (_, useAnimator) => {
    it('cycles the connecting sequence by default', () => {
      const { result } = renderHook(() => useAnimator('connecting', 5, 100));
      const first = result.current;
      advance(250);
      expect(result.current).not.toEqual(first);
    });

    it('holds the first frame when reduced motion is preferred', () => {
      reducedMotion.value = true;
      const { result } = renderHook(() => useAnimator('connecting', 5, 100));
      const first = result.current;
      advance(350);
      expect(result.current).toEqual(first);
    });
  });

  describe('grid animator', () => {
    it('cycles the thinking sequence by default', () => {
      const { result } = renderHook(() =>
        useAgentAudioVisualizerGridAnimator('thinking', 5, 5, 100),
      );
      const first = result.current;
      advance(250);
      expect(result.current).not.toEqual(first);
    });

    it('holds the first frame when reduced motion is preferred', () => {
      reducedMotion.value = true;
      const { result } = renderHook(() =>
        useAgentAudioVisualizerGridAnimator('thinking', 5, 5, 100),
      );
      const first = result.current;
      advance(350);
      expect(result.current).toEqual(first);
    });
  });

  describe('AgentChatIndicator', () => {
    it('renders without scaling when reduced motion is preferred', () => {
      reducedMotion.value = true;
      const { container } = render(<AgentChatIndicator />);
      advance(1000);
      const el = container.querySelector('span');
      expect(el).toBeInTheDocument();
      expect(el?.style.transform ?? '').not.toMatch(/scale/);
    });
  });
});
