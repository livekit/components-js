import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen, fireEvent } from '@testing-library/react';
import { AgentAudioVisualizerWave } from '@/components/agents-ui/agent-audio-visualizer-wave';
import { useAgentAudioVisualizerWave } from '@/hooks/agents-ui/use-agent-audio-visualizer-wave';

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

// jsdom doesn't compute `color-mix()`, so report the probe's color the way browsers do
const realGetComputedStyle = window.getComputedStyle;
function mockProbeColor(color: string) {
  vi.spyOn(window, 'getComputedStyle').mockImplementation((element, pseudo) => {
    const computed = realGetComputedStyle(element, pseudo);
    return element.matches('span[aria-hidden]')
      ? Object.create(computed, { color: { value: color } })
      : computed;
  });
}

describe('AgentAudioVisualizerWave', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
    render(<AgentAudioVisualizerWave data-testid="wave-viz" onClick={onClick} />);
    const visualizer = screen.getByTestId('wave-viz');
    fireEvent.click(visualizer);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('passes state to root data attribute', () => {
    render(<AgentAudioVisualizerWave state="speaking" data-testid="wave-viz" />);
    expect(screen.getByTestId('wave-viz')).toHaveAttribute('data-lk-state', 'speaking');
  });

  it('passes the text color and colorShift to shader uniforms', () => {
    mockProbeColor('color(srgb 0.1 0.2 0.3)');
    render(<AgentAudioVisualizerWave color="#123456" colorShift={0.25} data-testid="wave-viz" />);

    const shaderProps = mockReactShaderToy.mock.calls.at(-1)?.[0] as {
      uniforms?: Record<string, { value: number | number[] }>;
    };

    expect(screen.getByTestId('wave-viz')).toHaveStyle({ color: '#123456' });
    expect(shaderProps.uniforms?.uColor?.value).toEqual([0.1, 0.2, 0.3]);
    expect(shaderProps.uniforms?.uColorShift?.value).toBe(0.25);
  });

  it('forwards volume to the underlying hook', () => {
    render(<AgentAudioVisualizerWave state="speaking" volume={0.6} />);

    expect(useAgentAudioVisualizerWave).toHaveBeenCalledWith(
      expect.objectContaining({ volume: 0.6 }),
    );
  });

  it('shows a flat line in the wave color without WebGL', () => {
    const { container } = render(
      <AgentAudioVisualizerWave color="#123456" lineWidth={3} data-testid="wave-viz" />,
    );
    const { onUnsupported } = mockReactShaderToy.mock.calls.at(-1)?.[0] as {
      onUnsupported: () => void;
    };
    act(() => onUnsupported());

    expect(screen.queryByTestId('shader-toy')).not.toBeInTheDocument();
    expect(screen.getByTestId('wave-viz')).toHaveStyle({ color: '#123456' });
    const line = container.querySelector('[data-slot="wave-fallback"]');
    expect(line).toHaveClass('bg-current');
    expect(line).toHaveStyle({ height: '3px', opacity: '1' });
  });
});
