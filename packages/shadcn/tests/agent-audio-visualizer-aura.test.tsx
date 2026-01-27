import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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

vi.mock('@/components/agents-ui/react-shader-toy', () => ({
  ReactShaderToy: ({ className, ...props }: any) => (
    <div data-testid="shader-toy" className={className} {...props} />
  ),
}));

describe('AgentAudioVisualizerAura', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default props', () => {
    render(<AgentAudioVisualizerAura />);
    expect(screen.getByTestId('shader-toy')).toBeInTheDocument();
  });

  it('applies default size styles', () => {
    const { container } = render(<AgentAudioVisualizerAura />);
    expect(container.firstChild).toHaveClass('h-[224px]');
  });

  it('applies size styles when provided', () => {
    const { container } = render(<AgentAudioVisualizerAura size="sm" />);
    expect(container.firstChild).toHaveClass('h-[56px]');
  });

  it('merges custom className', () => {
    const { container } = render(<AgentAudioVisualizerAura className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
