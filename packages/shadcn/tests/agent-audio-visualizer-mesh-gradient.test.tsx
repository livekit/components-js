import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentAudioVisualizerMeshGradient } from '@/components/agents-ui/agent-audio-visualizer-mesh-gradient';

vi.mock('@/hooks/agents-ui/use-agent-audio-visualizer-mesh-gradient', () => ({
  useAgentAudioVisualizerMeshGradient: vi.fn(() => ({
    speed: 0.6,
    distortion: 0.3,
    swirl: 0.15,
  })),
}));

describe('AgentAudioVisualizerMeshGradient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders by default', () => {
    render(<AgentAudioVisualizerMeshGradient data-testid="mesh-gradient-viz" />);
    expect(screen.getByTestId('mesh-gradient-viz')).toBeInTheDocument();
  });

  it('applies html attributes (id, class, style, aria)', () => {
    render(
      <AgentAudioVisualizerMeshGradient
        id="mesh-gradient-viz"
        className="custom-class"
        style={{ opacity: 0.7 }}
        aria-label="Mesh gradient visualizer"
      />,
    );
    const visualizer = screen.getByLabelText('Mesh gradient visualizer');
    expect(visualizer).toHaveAttribute('id', 'mesh-gradient-viz');
    expect(visualizer).toHaveClass('custom-class');
    expect(visualizer).toHaveStyle({ opacity: '0.7' });
  });

  it('applies click handler', () => {
    const onClick = vi.fn();
    render(<AgentAudioVisualizerMeshGradient data-testid="mesh-gradient-viz" onClick={onClick} />);
    const visualizer = screen.getByTestId('mesh-gradient-viz');
    fireEvent.click(visualizer);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('passes state to root data attribute', () => {
    render(<AgentAudioVisualizerMeshGradient state="listening" data-testid="mesh-gradient-viz" />);
    expect(screen.getByTestId('mesh-gradient-viz')).toHaveAttribute('data-lk-state', 'listening');
  });

  it('renders with a custom grain amount', () => {
    render(<AgentAudioVisualizerMeshGradient grain={0} data-testid="mesh-gradient-viz" />);
    expect(screen.getByTestId('mesh-gradient-viz')).toBeInTheDocument();
  });

  it('renders with custom scale, distortion, swirl, and rotation', () => {
    render(
      <AgentAudioVisualizerMeshGradient
        scale={1.5}
        distortion={0}
        swirl={2}
        rotation={90}
        data-testid="mesh-gradient-viz"
      />,
    );
    expect(screen.getByTestId('mesh-gradient-viz')).toBeInTheDocument();
  });
});
