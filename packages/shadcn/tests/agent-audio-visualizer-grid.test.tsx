import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentAudioVisualizerGrid } from '@/components/agents-ui/agent-audio-visualizer-grid';

// Mock hooks
vi.mock('@livekit/components-react', async () => {
  const actual = await vi.importActual('@livekit/components-react');
  return {
    ...actual,
    useMultibandTrackVolume: vi.fn(() => []),
  };
});

vi.mock('@/hooks/agents-ui/use-agent-audio-visualizer-grid', () => ({
  useAgentAudioVisualizerGridAnimator: vi.fn(() => []),
}));

describe('AgentAudioVisualizerGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders by default', () => {
    render(<AgentAudioVisualizerGrid data-testid="grid-viz" />);
    expect(screen.getByTestId('grid-viz')).toBeInTheDocument();
  });

  it('applies html attributes (id, class, style, aria)', () => {
    render(
      <AgentAudioVisualizerGrid
        id="grid-viz"
        className="custom-class"
        style={{ opacity: 0.4 }}
        aria-label="Grid visualizer"
      />,
    );
    const visualizer = screen.getByLabelText('Grid visualizer');
    expect(visualizer).toHaveAttribute('id', 'grid-viz');
    expect(visualizer).toHaveClass('custom-class');
    expect(visualizer).toHaveStyle({ opacity: '0.4' });
  });

  it('applies click handler', () => {
    const onClick = vi.fn();
    render(<AgentAudioVisualizerGrid data-testid="grid-viz" onClick={onClick} />);
    const visualizer = screen.getByTestId('grid-viz');
    fireEvent.click(visualizer);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('passes state to root data attribute', () => {
    render(<AgentAudioVisualizerGrid state="speaking" data-testid="grid-viz" />);
    expect(screen.getByTestId('grid-viz')).toHaveAttribute('data-lk-state', 'speaking');
  });

  it('renders expected grid size with index metadata', () => {
    const { container } = render(<AgentAudioVisualizerGrid rowCount={3} columnCount={4} />);
    const cells = container.querySelectorAll('[data-lk-index]');

    expect(cells).toHaveLength(12);
    cells.forEach((cell, idx) => {
      expect(cell).toHaveAttribute('data-lk-index', String(idx));
    });
  });
});
