import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentAudioVisualizerBar } from '@/components/agents-ui/agent-audio-visualizer-bar';
import * as LiveKitComponents from '@livekit/components-react';

// Mock the @livekit/components-react hooks
vi.mock('@livekit/components-react', async () => {
  const actual = await vi.importActual('@livekit/components-react');
  return {
    ...actual,
    useMultibandTrackVolume: vi.fn(() => [0, 0, 0, 0, 0]),
  };
});

// Mock the custom hook
vi.mock('@/hooks/agents-ui/use-agent-audio-visualizer-bar', () => ({
  useAgentAudioVisualizerBarAnimator: vi.fn(() => [0]),
}));

describe('AgentAudioVisualizerBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders by default', () => {
    render(<AgentAudioVisualizerBar data-testid="bar-viz" />);
    expect(screen.getByTestId('bar-viz')).toBeInTheDocument();
  });

  it('applies html attributes (id, class, style, aria)', () => {
    render(
      <AgentAudioVisualizerBar
        id="bar-viz"
        className="custom-class"
        style={{ opacity: 0.5 }}
        aria-label="Bar visualizer"
      />,
    );
    const visualizer = screen.getByLabelText('Bar visualizer');
    expect(visualizer).toHaveAttribute('id', 'bar-viz');
    expect(visualizer).toHaveClass('custom-class');
    expect(visualizer).toHaveStyle({ opacity: '0.5' });
  });

  it('applies click handler', () => {
    const onClick = vi.fn();
    render(<AgentAudioVisualizerBar data-testid="bar-viz" onClick={onClick} />);
    const visualizer = screen.getByTestId('bar-viz');
    fireEvent.click(visualizer);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('passes state to root data attribute', () => {
    render(<AgentAudioVisualizerBar state="thinking" data-testid="bar-viz" />);
    expect(screen.getByTestId('bar-viz')).toHaveAttribute('data-lk-state', 'thinking');
  });

  it('applies color style from color prop', () => {
    render(<AgentAudioVisualizerBar color="#123456" data-testid="bar-viz" />);
    expect(screen.getByTestId('bar-viz')).toHaveStyle({ color: 'rgb(18, 52, 86)' });
  });

  it('renders bars with index/highlight attributes', () => {
    const { container } = render(<AgentAudioVisualizerBar barCount={3} />);
    const bars = container.querySelectorAll('[data-lk-index]');
    expect(bars).toHaveLength(3);
    expect(bars[0]).toHaveAttribute('data-lk-index', '0');
    expect(bars[1]).toHaveAttribute('data-lk-index', '1');
    expect(bars[2]).toHaveAttribute('data-lk-index', '2');
    expect(bars[0]).toHaveAttribute('data-lk-highlighted', 'true');
  });

  it('uses multiband volume for speaking state with audio track', () => {
    const mockTrack = {} as any;
    vi.mocked(LiveKitComponents.useMultibandTrackVolume).mockReturnValue([0.5, 0.7, 0.3, 0.6, 0.4]);
    render(<AgentAudioVisualizerBar state="speaking" audioTrack={mockTrack} />);
    expect(LiveKitComponents.useMultibandTrackVolume).toHaveBeenCalledWith(
      mockTrack,
      expect.objectContaining({ bands: 5, loPass: 100, hiPass: 200 }),
    );
  });

  it('accepts a single custom div child and clones it per bar', () => {
    const { container } = render(
      <AgentAudioVisualizerBar barCount={3}>
        <div data-testid="custom-bar" className="custom-bar" />
      </AgentAudioVisualizerBar>,
    );
    const bars = container.querySelectorAll('[data-testid="custom-bar"]');

    expect(bars).toHaveLength(3);
    bars.forEach((bar, idx) => {
      expect(bar).toHaveClass('custom-bar');
      expect(bar).toHaveAttribute('data-lk-index', String(idx));
    });
  });

  it('throws when children is not a single element', () => {
    expect(() =>
      render(
        <AgentAudioVisualizerBar barCount={3}>
          <div />
          <div />
        </AgentAudioVisualizerBar>,
      ),
    ).toThrow('AgentAudioVisualizerBar children must be a single element.');
  });
});
