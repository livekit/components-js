import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentAudioVisualizerGrid } from '@/components/agents-ui/agent-audio-visualizer-grid';
import { useMultibandTrackVolume } from '@livekit/components-react';
import { useAgentAudioVisualizerGridAnimator } from '@/hooks/agents-ui/use-agent-audio-visualizer-grid';

// Mock hooks
vi.mock('@livekit/components-react', async () => {
  const actual = await vi.importActual('@livekit/components-react');
  return {
    ...actual,
    useMultibandTrackVolume: vi.fn(() => []),
  };
});

vi.mock('@/hooks/agents-ui/use-agent-audio-visualizer-grid', () => ({
  useAgentAudioVisualizerGridAnimator: vi.fn(() => ({ x: 0, y: 0 })),
}));

describe('AgentAudioVisualizerGrid', () => {
  const mockUseMultibandTrackVolume = vi.mocked(useMultibandTrackVolume);
  const mockUseAgentAudioVisualizerGridAnimator = vi.mocked(useAgentAudioVisualizerGridAnimator);

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMultibandTrackVolume.mockReturnValue([]);
    mockUseAgentAudioVisualizerGridAnimator.mockReturnValue({ x: 0, y: 0 });
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

  it('applies color style from color prop', () => {
    render(<AgentAudioVisualizerGrid color="#123456" data-testid="grid-viz" />);
    expect(screen.getByTestId('grid-viz')).toHaveStyle({ color: 'rgb(18, 52, 86)' });
  });

  it('renders expected grid size with index metadata', () => {
    const { container } = render(<AgentAudioVisualizerGrid rowCount={3} columnCount={4} />);
    const cells = container.querySelectorAll('[data-lk-index]');

    expect(cells).toHaveLength(12);
    cells.forEach((cell, idx) => {
      expect(cell).toHaveAttribute('data-lk-index', String(idx));
    });
  });

  it('highlights the animated coordinate for non-speaking states', () => {
    mockUseAgentAudioVisualizerGridAnimator.mockReturnValue({ x: 1, y: 1 });

    const { container } = render(
      <AgentAudioVisualizerGrid state="connecting" rowCount={3} columnCount={3} />,
    );
    const cells = container.querySelectorAll('[data-lk-index]');

    expect(cells[4]).toHaveAttribute('data-lk-highlighted', 'true');
    expect(cells[0]).toHaveAttribute('data-lk-highlighted', 'false');
    expect(cells[8]).toHaveAttribute('data-lk-highlighted', 'false');
  });

  it('highlights cells from volume bands when speaking', () => {
    mockUseMultibandTrackVolume.mockReturnValue([1, 0]);

    const { container } = render(
      <AgentAudioVisualizerGrid state="speaking" rowCount={3} columnCount={2} />,
    );
    const cells = container.querySelectorAll('[data-lk-index]');

    expect(cells[0]).toHaveAttribute('data-lk-highlighted', 'true');
    expect(cells[1]).toHaveAttribute('data-lk-highlighted', 'false');
    expect(cells[2]).toHaveAttribute('data-lk-highlighted', 'true');
    expect(cells[3]).toHaveAttribute('data-lk-highlighted', 'true');
    expect(cells[4]).toHaveAttribute('data-lk-highlighted', 'true');
    expect(cells[5]).toHaveAttribute('data-lk-highlighted', 'false');
  });

  it('preserves custom child classes for Tailwind shadow control', () => {
    const { container } = render(
      <AgentAudioVisualizerGrid>
        <div className="shadow-none data-[lk-highlighted=true]:bg-foreground" />
      </AgentAudioVisualizerGrid>,
    );
    const firstCell = container.querySelector('[data-lk-index="0"]');

    expect(firstCell).toHaveClass('shadow-none');
    expect(firstCell).toHaveClass('data-[lk-highlighted=true]:bg-foreground');
  });

  it('throws when children is not a single element', () => {
    expect(() =>
      render(
        <AgentAudioVisualizerGrid>
          <div />
          <div />
        </AgentAudioVisualizerGrid>,
      ),
    ).toThrow('AgentAudioVisualizerGrid children must be a single element.');
  });
});
