import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentAudioVisualizerAura } from '@/components/agents-ui/agent-audio-visualizer-aura';

vi.mock('@/hooks/agents-ui/use-agent-audio-visualizer-aura', () => ({
  useAgentAudioVisualizerAura: vi.fn(() => ({
    speed: 1,
    scale: 0.2,
    amplitude: 0.4,
    frequency: 0.6,
    brightness: 0.8,
  })),
}));

describe('AgentAudioVisualizerAura', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders by default', () => {
    render(<AgentAudioVisualizerAura data-testid="aura-viz" />);
    expect(screen.getByTestId('aura-viz')).toBeInTheDocument();
  });

  it('applies html attributes (id, class, style, aria)', () => {
    render(
      <AgentAudioVisualizerAura
        id="aura-viz"
        className="custom-class"
        style={{ opacity: 0.7 }}
        aria-label="Aura visualizer"
      />,
    );
    const visualizer = screen.getByLabelText('Aura visualizer');
    expect(visualizer).toHaveAttribute('id', 'aura-viz');
    expect(visualizer).toHaveClass('custom-class');
    expect(visualizer).toHaveStyle({ opacity: '0.7' });
  });

  it('applies click handler', () => {
    const onClick = vi.fn();
    render(
      <AgentAudioVisualizerAura
        data-testid="aura-viz"
        onClick={onClick}
      />,
    );
    const visualizer = screen.getByTestId('aura-viz');
    fireEvent.click(visualizer);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('passes state to root data attribute', () => {
    render(<AgentAudioVisualizerAura state="listening" data-testid="aura-viz" />);
    expect(screen.getByTestId('aura-viz')).toHaveAttribute('data-lk-state', 'listening');
  });
});
