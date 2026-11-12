import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AgentAudioVisualizerAura } from '@/components/agents-ui/agent-audio-visualizer-aura';
import { useAgentAudioVisualizerAura } from '@/hooks/agents-ui/use-agent-audio-visualizer-aura';

const mockReactShaderToy = vi.fn();

vi.mock('@/components/agents-ui/react-shader-toy', () => ({
  ReactShaderToy: (props: Record<string, unknown>) => {
    mockReactShaderToy(props);
    return <div data-testid="shader-toy" />;
  },
}));

function lastUniform(name: string) {
  const shaderProps = mockReactShaderToy.mock.calls.at(-1)?.[0] as {
    uniforms?: Record<string, { value: number | number[] }>;
  };
  return shaderProps.uniforms?.[name]?.value;
}

function lastUModeValue() {
  return lastUniform('uMode');
}

// jsdom doesn't compute `color-mix()`, so report the probe's color the way browsers do
let probeColor = '';
const realGetComputedStyle = window.getComputedStyle;
function mockProbeColor(color: string) {
  probeColor = color;
  vi.spyOn(window, 'getComputedStyle').mockImplementation((element, pseudo) => {
    const computed = realGetComputedStyle(element, pseudo);
    return element.matches('span[aria-hidden]')
      ? Object.create(computed, { color: { get: () => probeColor } })
      : computed;
  });
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

  describe('color', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('defaults to the brand color, which a text color class replaces', () => {
      const { rerender } = render(<AgentAudioVisualizerAura data-testid="aura-viz" />);
      expect(screen.getByTestId('aura-viz')).toHaveClass('text-[#1FD5F9]');

      rerender(<AgentAudioVisualizerAura className="text-primary" data-testid="aura-viz" />);
      expect(screen.getByTestId('aura-viz')).toHaveClass('text-primary');
      expect(screen.getByTestId('aura-viz')).not.toHaveClass('text-[#1FD5F9]');
    });

    it('sets the color prop as the text color', () => {
      render(<AgentAudioVisualizerAura color="var(--primary)" data-testid="aura-viz" />);
      expect(screen.getByTestId('aura-viz').style.color).toBe('var(--primary)');
    });

    it('keeps a text color set through style', () => {
      render(<AgentAudioVisualizerAura style={{ color: 'var(--brand)' }} data-testid="aura-viz" />);
      expect(screen.getByTestId('aura-viz').style.color).toBe('var(--brand)');
    });

    it('keeps its color transition when the page turns transitions off', () => {
      const { container } = render(<AgentAudioVisualizerAura />);
      const probe = container.querySelector<HTMLElement>('span[aria-hidden]')!;
      expect(probe.style.getPropertyPriority('transition')).toBe('important');
    });

    it("keeps the probe's transitionend from reaching handlers around it", () => {
      const onTransitionEnd = vi.fn();
      const { container } = render(
        <div onTransitionEnd={onTransitionEnd}>
          <AgentAudioVisualizerAura />
        </div>,
      );
      fireEvent(
        container.querySelector('span[aria-hidden]')!,
        new Event('transitionend', { bubbles: true }),
      );
      expect(onTransitionEnd).not.toHaveBeenCalled();
    });

    it('passes the text color to the shader, clamped to sRGB', () => {
      mockProbeColor('color(srgb -0.2 0.5 1.1)');
      render(<AgentAudioVisualizerAura />);
      expect(lastUniform('uColor')).toEqual([0, 0.5, 1]);
    });

    it('reads the color again when it changes', () => {
      mockProbeColor('color(srgb 0.1 0.2 0.3)');
      const { container } = render(<AgentAudioVisualizerAura />);
      expect(lastUniform('uColor')).toEqual([0.1, 0.2, 0.3]);

      probeColor = 'color(srgb 0.4 0.5 0.6)';
      fireEvent(container.querySelector('span[aria-hidden]')!, new Event('transitionend'));
      expect(lastUniform('uColor')).toEqual([0.4, 0.5, 0.6]);
    });
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

  describe('without WebGL', () => {
    function reportUnsupported() {
      const { onUnsupported } = mockReactShaderToy.mock.calls.at(-1)?.[0] as {
        onUnsupported: () => void;
      };
      act(() => onUnsupported());
    }

    it('shows a still glow in the aura color', () => {
      const { container } = render(
        <AgentAudioVisualizerAura color="#123456" state="listening" data-testid="aura-viz" />,
      );
      reportUnsupported();

      expect(screen.queryByTestId('shader-toy')).not.toBeInTheDocument();
      expect(screen.getByTestId('aura-viz')).toHaveAttribute('data-lk-state', 'listening');
      expect(screen.getByTestId('aura-viz')).toHaveStyle({ color: '#123456' });
      const glow = container.querySelector('[data-slot="aura-fallback"]');
      expect(glow?.getAttribute('style')).toContain('currentcolor');
      // Scale 0.2 and brightness 0.8 from the mocked hook
      expect(glow).toHaveStyle({ width: '50%', opacity: String(0.8 / 1.5) });
    });
  });
});
