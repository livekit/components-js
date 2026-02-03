import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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

  describe('Rendering', () => {
    it('renders with default props', () => {
      const { container } = render(<AgentAudioVisualizerBar />);
      const visualizer = container.querySelector('.relative.flex');
      expect(visualizer).toBeInTheDocument();
    });

    it('renders correct number of bars by default', () => {
      const { container } = render(<AgentAudioVisualizerBar />);
      const bars = container.querySelectorAll('[data-lk-index]');
      expect(bars).toHaveLength(5); // default for md size
    });

    it('renders with custom bar count', () => {
      const { container } = render(<AgentAudioVisualizerBar barCount={7} />);
      const bars = container.querySelectorAll('[data-lk-index]');
      expect(bars).toHaveLength(7);
    });

    it('renders with custom children', () => {
      const { container } = render(
        <AgentAudioVisualizerBar>
          <span className="custom-bar">Bar</span>
        </AgentAudioVisualizerBar>,
      );
      const bars = container.querySelectorAll('.custom-bar');
      expect(bars.length).toBeGreaterThan(0);
    });
  });

  describe('Sizes', () => {
    it('renders icon size with 3 bars by default', () => {
      const { container } = render(<AgentAudioVisualizerBar size="icon" />);
      const bars = container.querySelectorAll('[data-lk-index]');
      expect(bars).toHaveLength(3);
    });

    it('renders sm size with 3 bars by default', () => {
      const { container } = render(<AgentAudioVisualizerBar size="sm" />);
      const bars = container.querySelectorAll('[data-lk-index]');
      expect(bars).toHaveLength(3);
    });

    it('renders md size with 5 bars by default', () => {
      const { container } = render(<AgentAudioVisualizerBar size="md" />);
      const bars = container.querySelectorAll('[data-lk-index]');
      expect(bars).toHaveLength(5);
    });

    it('renders lg size with 5 bars by default', () => {
      const { container } = render(<AgentAudioVisualizerBar size="lg" />);
      const bars = container.querySelectorAll('[data-lk-index]');
      expect(bars).toHaveLength(5);
    });

    it('renders xl size with 5 bars by default', () => {
      const { container } = render(<AgentAudioVisualizerBar size="xl" />);
      const bars = container.querySelectorAll('[data-lk-index]');
      expect(bars).toHaveLength(5);
    });

    it('applies icon size styles', () => {
      const { container } = render(<AgentAudioVisualizerBar size="icon" />);
      const visualizer = container.querySelector('.relative.flex');
      expect(visualizer).toHaveClass('h-[24px]', 'gap-[2px]');
    });

    it('applies sm size styles', () => {
      const { container } = render(<AgentAudioVisualizerBar size="sm" />);
      const visualizer = container.querySelector('.relative.flex');
      expect(visualizer).toHaveClass('h-[56px]', 'gap-[4px]');
    });

    it('applies md size styles', () => {
      const { container } = render(<AgentAudioVisualizerBar size="md" />);
      const visualizer = container.querySelector('.relative.flex');
      expect(visualizer).toHaveClass('h-[112px]', 'gap-[8px]');
    });

    it('applies lg size styles', () => {
      const { container } = render(<AgentAudioVisualizerBar size="lg" />);
      const visualizer = container.querySelector('.relative.flex');
      expect(visualizer).toHaveClass('h-[224px]', 'gap-[16px]');
    });

    it('applies xl size styles', () => {
      const { container } = render(<AgentAudioVisualizerBar size="xl" />);
      const visualizer = container.querySelector('.relative.flex');
      expect(visualizer).toHaveClass('h-[448px]', 'gap-[32px]');
    });
  });

  describe('State', () => {
    it('uses connecting state by default', () => {
      render(<AgentAudioVisualizerBar />);
      // Component renders without error
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('accepts connecting state', () => {
      const { container } = render(<AgentAudioVisualizerBar state="connecting" />);
      expect(container.querySelector('.relative.flex')).toBeInTheDocument();
    });

    it('accepts initializing state', () => {
      const { container } = render(<AgentAudioVisualizerBar state="initializing" />);
      expect(container.querySelector('.relative.flex')).toBeInTheDocument();
    });

    it('accepts listening state', () => {
      const { container } = render(<AgentAudioVisualizerBar state="listening" />);
      expect(container.querySelector('.relative.flex')).toBeInTheDocument();
    });

    it('accepts thinking state', () => {
      const { container } = render(<AgentAudioVisualizerBar state="thinking" />);
      expect(container.querySelector('.relative.flex')).toBeInTheDocument();
    });

    it('accepts speaking state', () => {
      const { container } = render(<AgentAudioVisualizerBar state="speaking" />);
      expect(container.querySelector('.relative.flex')).toBeInTheDocument();
    });
  });

  describe('Audio Track', () => {
    it('renders without audio track', () => {
      const { container } = render(<AgentAudioVisualizerBar />);
      expect(container.querySelector('.relative.flex')).toBeInTheDocument();
    });

    it('accepts audio track prop', () => {
      const mockTrack = {} as any;
      const { container } = render(<AgentAudioVisualizerBar audioTrack={mockTrack} />);
      expect(container.querySelector('.relative.flex')).toBeInTheDocument();
    });

    it('uses multiband volume when speaking with audio track', () => {
      const mockTrack = {} as any;
      vi.mocked(LiveKitComponents.useMultibandTrackVolume).mockReturnValue([
        0.5, 0.7, 0.3, 0.6, 0.4,
      ]);

      const { container } = render(
        <AgentAudioVisualizerBar state="speaking" audioTrack={mockTrack} />,
      );

      expect(LiveKitComponents.useMultibandTrackVolume).toHaveBeenCalledWith(
        mockTrack,
        expect.objectContaining({
          bands: 5,
          loPass: 100,
          hiPass: 200,
        }),
      );
    });
  });

  describe('HTML Attributes', () => {
    it('accepts and applies className prop', () => {
      const { container } = render(<AgentAudioVisualizerBar className="custom-class" />);
      const visualizer = container.querySelector('.custom-class');
      expect(visualizer).toBeInTheDocument();
    });

    it('accepts and applies style prop', () => {
      const { container } = render(<AgentAudioVisualizerBar style={{ backgroundColor: 'red' }} />);
      const visualizer = container.querySelector('.relative.flex');
      expect(visualizer).toBeInTheDocument();
    });

    it('accepts and applies id prop', () => {
      const { container } = render(<AgentAudioVisualizerBar id="visualizer-id" />);
      const visualizer = container.querySelector('#visualizer-id');
      expect(visualizer).toBeInTheDocument();
    });

    it('accepts and applies data attributes', () => {
      render(<AgentAudioVisualizerBar data-testid="custom-visualizer" />);
      expect(screen.getByTestId('custom-visualizer')).toBeInTheDocument();
    });
  });

  describe('Bar Attributes', () => {
    it('applies data-lk-index to each bar', () => {
      const { container } = render(<AgentAudioVisualizerBar barCount={3} />);
      const bars = container.querySelectorAll('[data-lk-index]');

      expect(bars[0]).toHaveAttribute('data-lk-index', '0');
      expect(bars[1]).toHaveAttribute('data-lk-index', '1');
      expect(bars[2]).toHaveAttribute('data-lk-index', '2');
    });

    it('applies data-lk-highlighted attribute', () => {
      const { container } = render(<AgentAudioVisualizerBar />);
      const bars = container.querySelectorAll('[data-lk-highlighted]');
      expect(bars.length).toBeGreaterThan(0);
    });

    it('applies height style to bars', () => {
      const { container } = render(<AgentAudioVisualizerBar />);
      const bars = container.querySelectorAll('[data-lk-index]');
      bars.forEach((bar) => {
        expect(bar).toHaveAttribute('style');
      });
    });
  });

  describe('Custom Children', () => {
    it('clones and enhances custom children', () => {
      const { container } = render(
        <AgentAudioVisualizerBar barCount={2}>
          <span className="custom-bar">Custom</span>
        </AgentAudioVisualizerBar>,
      );

      const bars = container.querySelectorAll('.custom-bar');
      expect(bars.length).toBe(2);
      bars.forEach((bar) => {
        expect(bar).toHaveAttribute('data-lk-index');
        expect(bar).toHaveAttribute('data-lk-highlighted');
      });
    });

    it('preserves child classNames when cloning', () => {
      const { container } = render(
        <AgentAudioVisualizerBar barCount={1}>
          <div className="original-class">Bar</div>
        </AgentAudioVisualizerBar>,
      );

      const bar = container.querySelector('.original-class');
      expect(bar).toBeInTheDocument();
    });
  });

  describe('Combined Props', () => {
    it('applies size, state, and className together', () => {
      vi.mocked(LiveKitComponents.useMultibandTrackVolume).mockReturnValue(new Array(7).fill(0));

      const { container } = render(
        <AgentAudioVisualizerBar
          size="lg"
          state="speaking"
          className="custom-class"
          barCount={7}
        />,
      );

      const visualizer = container.querySelector('.custom-class');
      expect(visualizer).toHaveClass('h-[224px]');

      const bars = container.querySelectorAll('[data-lk-index]');
      expect(bars).toHaveLength(7);
    });
  });
});
