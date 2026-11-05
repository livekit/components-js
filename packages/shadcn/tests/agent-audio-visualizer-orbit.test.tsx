import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentAudioVisualizerOrbit } from '@/components/agents-ui/agent-audio-visualizer-orbit';
import { useAgentAudioVisualizerOrbit } from '@/hooks/agents-ui/use-agent-audio-visualizer-orbit';

vi.mock('@/hooks/agents-ui/use-agent-audio-visualizer-orbit', () => ({
  ORBIT_BAND_COUNT: 7,
  useAgentAudioVisualizerOrbit: vi.fn(() => ({
    level: 0,
    bands: new Array(7).fill(0),
    connected: true,
    swirl: 0.55,
    breatheFrequency: 2.1,
  })),
}));

describe('AgentAudioVisualizerOrbit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders by default', () => {
    render(<AgentAudioVisualizerOrbit data-testid="orbit-viz" />);
    expect(screen.getByTestId('orbit-viz')).toBeInTheDocument();
  });

  it('applies html attributes (id, class, style, aria)', () => {
    render(
      <AgentAudioVisualizerOrbit
        id="orbit-viz"
        className="custom-class"
        style={{ opacity: 0.7 }}
        aria-label="Orbit visualizer"
      />,
    );
    const visualizer = screen.getByLabelText('Orbit visualizer');
    expect(visualizer).toHaveAttribute('id', 'orbit-viz');
    expect(visualizer).toHaveClass('custom-class');
    expect(visualizer).toHaveStyle({ opacity: '0.7' });
  });

  it('applies click handler', () => {
    const onClick = vi.fn();
    render(<AgentAudioVisualizerOrbit data-testid="orbit-viz" onClick={onClick} />);
    const visualizer = screen.getByTestId('orbit-viz');
    fireEvent.click(visualizer);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('passes state to root data attribute', () => {
    render(<AgentAudioVisualizerOrbit state="listening" data-testid="orbit-viz" />);
    expect(screen.getByTestId('orbit-viz')).toHaveAttribute('data-lk-state', 'listening');
  });

  it('renders as a canvas element', () => {
    render(<AgentAudioVisualizerOrbit data-testid="orbit-viz" />);
    expect(screen.getByTestId('orbit-viz').tagName).toBe('CANVAS');
  });

  it('forwards volume to the underlying hook', () => {
    render(<AgentAudioVisualizerOrbit state="speaking" volume={0.6} />);

    expect(useAgentAudioVisualizerOrbit).toHaveBeenCalledWith('speaking', undefined, 0.6);
  });
});
