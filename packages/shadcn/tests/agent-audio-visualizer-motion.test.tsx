import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { AgentAudioVisualizerBar } from '@/components/agents-ui/agent-audio-visualizer-bar';
import { AgentAudioVisualizerGrid } from '@/components/agents-ui/agent-audio-visualizer-grid';
import { AgentAudioVisualizerRadial } from '@/components/agents-ui/agent-audio-visualizer-radial';
import { AgentAudioVisualizerWave } from '@/components/agents-ui/agent-audio-visualizer-wave';
import { AgentAudioVisualizerAura } from '@/components/agents-ui/agent-audio-visualizer-aura';
import {
  AgentAudioVisualizerState,
  AgentAudioVisualizerToggle,
} from '@/components/agents-ui/agent-audio-visualizer-motion';
import { useAgentAudioVisualizerMotion } from '@/hooks/agents-ui/use-agent-audio-visualizer-motion';
import { useTrackVolume, useMultibandTrackVolume } from '@livekit/components-react';

vi.mock('@livekit/components-react', () => ({
  useTrackVolume: vi.fn(() => 0),
  useMultibandTrackVolume: vi.fn(() => [0, 0, 0, 0, 0]),
}));
vi.mock('@/components/agents-ui/react-shader-toy', () => ({ ReactShaderToy: () => <canvas /> }));

let reduced: boolean;
let listeners: Set<() => void>;
beforeEach(() => {
  reduced = true;
  listeners = new Set();
  vi.clearAllMocks();
  vi.stubGlobal('matchMedia', () => ({
    get matches() {
      return reduced;
    },
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
  }));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
function changePreference(value: boolean) {
  act(() => {
    reduced = value;
    listeners.forEach((fn) => fn());
  });
}

describe('shared visualizer motion preference', () => {
  it('starts paused and allows repeated play and pause without changing the preference', () => {
    const { result } = renderHook(useAgentAudioVisualizerMotion);
    expect(result.current.paused).toBe(true);
    act(() => result.current.setPaused(false));
    expect(result.current.paused).toBe(false);
    expect(result.current.prefersReducedMotion).toBe(true);
    act(() => result.current.setPaused(true));
    expect(result.current.paused).toBe(true);
  });
  it('resets playback choice when the system preference changes in either direction', () => {
    reduced = false;
    const { result } = renderHook(useAgentAudioVisualizerMotion);
    expect(result.current.paused).toBe(false);
    changePreference(true);
    expect(result.current.paused).toBe(true);
    act(() => result.current.setPaused(false));
    changePreference(false);
    expect(result.current.paused).toBe(false);
    changePreference(true);
    expect(result.current.paused).toBe(true);
  });
  it('keeps choices local and cleans up media-query listeners', () => {
    const first = renderHook(useAgentAudioVisualizerMotion);
    const second = renderHook(useAgentAudioVisualizerMotion);
    act(() => first.result.current.setPaused(false));
    expect(second.result.current.paused).toBe(true);
    first.unmount();
    second.unmount();
    expect(listeners.size).toBe(0);
  });
  it('supports environments without matchMedia', () => {
    vi.stubGlobal('matchMedia', undefined);
    const { result } = renderHook(useAgentAudioVisualizerMotion);
    expect(result.current.paused).toBe(false);
  });
  it('hydrates from paused text before following the client preference', async () => {
    reduced = false;
    function Probe() {
      const { paused } = useAgentAudioVisualizerMotion();
      return <output>{paused ? 'Paused' : 'Playing'}</output>;
    }
    const container = document.createElement('div');
    container.innerHTML = renderToString(<Probe />);
    expect(container.textContent).toBe('Paused');
    const error = vi.fn();
    let root: ReturnType<typeof hydrateRoot>;
    await act(async () => {
      root = hydrateRoot(container, <Probe />, { onRecoverableError: error });
    });
    expect(error).not.toHaveBeenCalled();
    expect(container.textContent).toBe('Playing');
    act(() => root.unmount());
  });
});

const visualizers = [
  ['Bar', AgentAudioVisualizerBar],
  ['Grid', AgentAudioVisualizerGrid],
  ['Radial', AgentAudioVisualizerRadial],
  ['Wave', AgentAudioVisualizerWave],
  ['Aura', AgentAudioVisualizerAura],
] as const;

describe.each(visualizers)('%s reduced motion', (_, Visualizer) => {
  it('shows current state and forwards root props without starting audio analysis', () => {
    const ref = createRef<HTMLDivElement>();
    const click = vi.fn();
    const { rerender } = render(
      <Visualizer
        ref={ref}
        state="listening"
        id="visualizer"
        className="custom"
        style={{ width: 180 }}
        onClick={click}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Listening');
    expect(ref.current).toHaveAttribute('id', 'visualizer');
    expect(ref.current).toHaveClass('custom');
    expect(ref.current).toHaveStyle({ width: '180px' });
    fireEvent.click(ref.current!);
    expect(click).toHaveBeenCalledOnce();
    expect(useTrackVolume).not.toHaveBeenCalled();
    expect(useMultibandTrackVolume).not.toHaveBeenCalled();
    rerender(<Visualizer state="thinking" />);
    expect(screen.getByRole('status')).toHaveTextContent('Thinking');
  });
  it('plays only on request and returns to text when paused', () => {
    function Example() {
      const { paused, setPaused } = useAgentAudioVisualizerMotion();
      return (
        <>
          <Visualizer state="speaking" paused={paused} />
          <AgentAudioVisualizerToggle paused={paused} onPausedChange={setPaused} />
        </>
      );
    }
    render(<Example />);
    fireEvent.click(screen.getByRole('button', { name: 'Play animation' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Pause animation' }));
    expect(screen.getByRole('status')).toHaveTextContent('Speaking');
    expect(screen.queryByRole('button', { name: 'Pause animation' })).not.toBeInTheDocument();
  });
  it('follows live preferences when uncontrolled and supports custom paused content', () => {
    reduced = false;
    const { rerender } = render(<Visualizer state="listening" />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    changePreference(true);
    expect(screen.getByRole('status')).toHaveTextContent('Listening');
    rerender(
      <Visualizer
        state="listening"
        pausedContent={
          <AgentAudioVisualizerState state="listening" labels={{ listening: 'Escuchando' }} />
        }
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Escuchando');
  });
});

it('the animation toggle respects disabled and prevented clicks', () => {
  const change = vi.fn();
  const { rerender } = render(
    <AgentAudioVisualizerToggle paused disabled onPausedChange={change} />,
  );
  fireEvent.click(screen.getByRole('button'));
  expect(change).not.toHaveBeenCalled();
  rerender(
    <AgentAudioVisualizerToggle
      paused
      onPausedChange={change}
      onClick={(e) => e.preventDefault()}
    />,
  );
  fireEvent.click(screen.getByRole('button'));
  expect(change).not.toHaveBeenCalled();
});
