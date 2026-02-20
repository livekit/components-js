import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentAudioVisualizerWave } from '@/components/agents-ui/agent-audio-visualizer-wave';

const mockReactShaderToy = vi.fn();

// Mock the hooks and components
vi.mock('@/hooks/agents-ui/use-agent-audio-visualizer-wave', () => ({
  useAgentAudioVisualizerWave: vi.fn(() => ({
    frequency: 1.0,
    amplitude: 0.5,
    speed: 1.0,
    opacity: 1.0,
  })),
}));

vi.mock('@/components/agents-ui/react-shader-toy', () => ({
  ReactShaderToy: (props: Record<string, unknown>) => {
    mockReactShaderToy(props);
    return <div data-testid="shader-toy" />;
  },
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

  it('passes color and colorShift to shader uniforms', () => {
    render(<AgentAudioVisualizerWave color="#123456" colorShift={0.25} data-testid="wave-viz" />);

    const shaderProps = mockReactShaderToy.mock.calls[0]?.[0] as {
      uniforms?: Record<string, { value: number | number[] }>;
    };

    expect(shaderProps.uniforms?.uColor?.value).toEqual([18 / 255, 52 / 255, 86 / 255]);
    expect(shaderProps.uniforms?.uColorShift?.value).toBe(0.25);
  });
});
