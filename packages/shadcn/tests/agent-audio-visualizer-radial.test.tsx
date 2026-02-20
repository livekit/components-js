import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentAudioVisualizerRadial } from '@/components/agents-ui/agent-audio-visualizer-radial';
// Mock hooks
vi.mock('@livekit/components-react', async () => {
  const actual = await vi.importActual('@livekit/components-react');
  return { ...actual, useMultibandTrackVolume: vi.fn(() => []) };
});

vi.mock('@/hooks/agents-ui/use-agent-audio-visualizer-radial', () => ({
  useAgentAudioVisualizerRadialAnimator: vi.fn(() => []),
}));

describe('AgentAudioVisualizerRadial', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders by default', () => {
    render(<AgentAudioVisualizerRadial data-testid="radial-viz" />);
    expect(screen.getByTestId('radial-viz')).toBeInTheDocument();
  });

  it('applies html attributes (id, class, style, aria)', () => {
    render(
      <AgentAudioVisualizerRadial
        id="radial-viz"
        className="custom-class"
        style={{ opacity: 0.6 }}
        aria-label="Radial visualizer"
      />,
    );
    const visualizer = screen.getByLabelText('Radial visualizer');
    expect(visualizer).toHaveAttribute('id', 'radial-viz');
    expect(visualizer).toHaveClass('custom-class');
    expect(visualizer).toHaveStyle({ opacity: '0.6' });
  });

  it('applies click handler', () => {
    const onClick = vi.fn();
    render(
      <AgentAudioVisualizerRadial
        data-testid="radial-viz"
        onClick={onClick}
      />,
    );
    const visualizer = screen.getByTestId('radial-viz');
    fireEvent.click(visualizer);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('passes state to root data attribute', () => {
    render(<AgentAudioVisualizerRadial state="speaking" data-testid="radial-viz" />);
    expect(screen.getByTestId('radial-viz')).toHaveAttribute('data-lk-state', 'speaking');
  });

  it('applies color style from color prop', () => {
    render(<AgentAudioVisualizerRadial color="#123456" data-testid="radial-viz" />);
    expect(screen.getByTestId('radial-viz')).toHaveStyle({ color: 'rgb(18, 52, 86)' });
  });

  it('renders expected radial bars', () => {
    const { container } = render(<AgentAudioVisualizerRadial barCount={8} />);
    const bars = container.querySelectorAll('[data-lk-index]');
    expect(bars).toHaveLength(8);
    bars.forEach((bar, idx) => {
      expect(bar).toHaveAttribute('data-lk-index', String(idx));
      expect(bar).toHaveAttribute('data-lk-highlighted');
    });
  });
});
