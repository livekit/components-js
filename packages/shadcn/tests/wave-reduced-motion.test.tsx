import { act, renderHook } from '@testing-library/react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AgentState } from '@livekit/components-react';
import { useAgentAudioVisualizerWave } from '@/hooks/agents-ui/use-agent-audio-visualizer-wave';

vi.mock('@livekit/components-react', () => ({ useTrackVolume: () => 0.8 }));

describe('wave reduced motion (real Motion values)', () => {
  let reduced: boolean;
  let listeners: Set<() => void>;

  beforeEach(() => {
    reduced = true;
    listeners = new Set();
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        get matches() {
          return reduced;
        },
        addEventListener: (_: string, listener: () => void) => listeners.add(listener),
        removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
      })),
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  function changePreference(value: boolean) {
    act(() => {
      reduced = value;
      listeners.forEach((listener) => listener());
    });
  }

  it.each<AgentState>([
    'disconnected',
    'connecting',
    'initializing',
    'listening',
    'thinking',
    'speaking',
    'idle',
    'pre-connect-buffering',
    'failed',
  ])('keeps %s still and fully visible when motion is reduced', (state) => {
    const { result } = renderHook(() => useAgentAudioVisualizerWave({ state }));
    expect(result.current.speed).toBe(0);
    expect(result.current.opacity).toBe(1);
    expect(Number.isFinite(result.current.amplitude)).toBe(true);
    expect(Number.isFinite(result.current.frequency)).toBe(true);
  });

  it('ignores live volume changes without losing distinct state shapes', () => {
    const { result, rerender } = renderHook(
      ({ state, volume }) => useAgentAudioVisualizerWave({ state, volume }),
      { initialProps: { state: 'speaking' as AgentState, volume: 0.1 } },
    );
    const speaking = { ...result.current };
    rerender({ state: 'speaking', volume: 1 });
    expect(result.current).toEqual(speaking);
    rerender({ state: 'listening', volume: 1 });
    expect(result.current.amplitude).not.toBe(speaking.amplitude);
    const listening = { ...result.current };
    rerender({ state: 'thinking', volume: 1 });
    expect(result.current.frequency).not.toBe(listening.frequency);
    rerender({ state: 'disconnected', volume: 1 });
    expect(result.current.amplitude).toBe(0);
  });

  it('stops and resumes motion when the preference changes without remounting', () => {
    reduced = false;
    const { result } = renderHook(() => useAgentAudioVisualizerWave({ state: 'listening' }));
    expect(result.current.speed).toBeGreaterThan(0);
    changePreference(true);
    expect(result.current.speed).toBe(0);
    expect(result.current.opacity).toBe(1);
    changePreference(false);
    expect(result.current.speed).toBeGreaterThan(0);
  });

  it('removes its media-query subscription on unmount', () => {
    const { unmount } = renderHook(() => useAgentAudioVisualizerWave({}));
    expect(listeners.size).toBeGreaterThan(0);
    unmount();
    expect(listeners.size).toBe(0);
  });

  it('works in environments without matchMedia', () => {
    vi.stubGlobal('matchMedia', undefined);
    const { result } = renderHook(() => useAgentAudioVisualizerWave({ state: 'speaking' }));
    expect(Number.isFinite(result.current.speed)).toBe(true);
  });

  it('hydrates a still server snapshot before applying the browser preference', async () => {
    reduced = false;
    function Probe() {
      const { speed } = useAgentAudioVisualizerWave({ state: 'listening' });
      return <output>{speed}</output>;
    }
    const container = document.createElement('div');
    container.innerHTML = renderToString(<Probe />);
    expect(container.textContent).toBe('0');
    const onRecoverableError = vi.fn();
    let root: ReturnType<typeof hydrateRoot>;
    await act(async () => {
      root = hydrateRoot(container, <Probe />, { onRecoverableError });
    });
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(Number(container.textContent)).toBeGreaterThan(0);
    act(() => root.unmount());
  });
});
