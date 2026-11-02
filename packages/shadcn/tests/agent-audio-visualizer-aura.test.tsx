import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AgentAudioVisualizerAura } from '@/components/agents-ui/agent-audio-visualizer-aura';
import { useAgentAudioVisualizerAura } from '@/hooks/agents-ui/use-agent-audio-visualizer-aura';

const mockReactShaderToy = vi.fn();

vi.mock('@/components/agents-ui/react-shader-toy', () => ({
  ReactShaderToy: (props: Record<string, unknown>) => {
    mockReactShaderToy(props);
    return <div data-testid="shader-toy" />;
  },
}));

function lastUModeValue() {
  const shaderProps = mockReactShaderToy.mock.calls.at(-1)?.[0] as {
    uniforms?: Record<string, { value: number | number[] }>;
  };
  return shaderProps.uniforms?.uMode?.value;
}

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
    render(<AgentAudioVisualizerAura data-testid="aura-viz" onClick={onClick} />);
    const visualizer = screen.getByTestId('aura-viz');
    fireEvent.click(visualizer);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('passes state to root data attribute', () => {
    render(<AgentAudioVisualizerAura state="listening" data-testid="aura-viz" />);
    expect(screen.getByTestId('aura-viz')).toHaveAttribute('data-lk-state', 'listening');
  });

  it('forwards volume to the underlying hook', () => {
    render(<AgentAudioVisualizerAura state="speaking" volume={0.6} />);

    expect(useAgentAudioVisualizerAura).toHaveBeenCalledWith('speaking', undefined, 0.6);
  });

  describe('theme mode', () => {
    afterEach(() => {
      document.documentElement.classList.remove('dark');
    });

    it('uses light mode when <html> has no dark class', () => {
      render(<AgentAudioVisualizerAura />);
      expect(lastUModeValue()).toBe(1.0);
    });

    it('uses dark mode when <html> has the dark class', () => {
      document.documentElement.classList.add('dark');
      render(<AgentAudioVisualizerAura />);
      expect(lastUModeValue()).toBe(0.0);
    });

    it('follows the dark class when the page theme changes', async () => {
      render(<AgentAudioVisualizerAura />);
      expect(lastUModeValue()).toBe(1.0);

      document.documentElement.classList.add('dark');
      await waitFor(() => expect(lastUModeValue()).toBe(0.0));

      document.documentElement.classList.remove('dark');
      await waitFor(() => expect(lastUModeValue()).toBe(1.0));
    });

    it('prefers the themeMode prop over the page theme', () => {
      document.documentElement.classList.add('dark');
      render(<AgentAudioVisualizerAura themeMode="light" />);
      expect(lastUModeValue()).toBe(1.0);
    });
  });
});
