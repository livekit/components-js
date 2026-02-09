import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentAudioVisualizerWave } from '@/components/agents-ui/agent-audio-visualizer-wave';

// Mock the hooks and components
vi.mock('@/hooks/agents-ui/use-agent-audio-visualizer-wave', () => ({
  useAgentAudioVisualizerWave: vi.fn(() => ({
    frequency: 1.0,
    amplitude: 0.5,
    speed: 1.0,
    lineWidth: 2.0,
    smoothing: 1.0,
    brightness: 1.0,
  })),
}));

describe('AgentAudioVisualizerWave', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders by default', () => {
    render(<AgentAudioVisualizerWave data-testid="wave-viz" />);
    expect(screen.getByTestId('wave-viz')).toBeInTheDocument();
  });

  it('applies html attributes (id, class, style, aria)', () => {
    render(
      <AgentAudioVisualizerWave
        id="wave-viz"
        className="custom-class"
        style={{ opacity: 0.8 }}
        aria-label="Wave visualizer"
      />,
    );
    const visualizer = screen.getByLabelText('Wave visualizer');
    expect(visualizer).toHaveAttribute('id', 'wave-viz');
    expect(visualizer).toHaveClass('custom-class');
    expect(visualizer).toHaveStyle({ opacity: '0.8' });
  });

  it('applies click handler', () => {
    const onClick = vi.fn();
    render(
      <AgentAudioVisualizerWave
        data-testid="wave-viz"
        onClick={onClick}
      />,
    );
    const visualizer = screen.getByTestId('wave-viz');
    fireEvent.click(visualizer);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('passes state to root data attribute', () => {
    render(<AgentAudioVisualizerWave state="speaking" data-testid="wave-viz" />);
    expect(screen.getByTestId('wave-viz')).toHaveAttribute('data-lk-state', 'speaking');
  });
});
