import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AgentAudioVisualizerRadial } from './agent-audio-visualizer-radial';
import * as LiveKitComponents from '@livekit/components-react';

// Mock hooks
vi.mock('@livekit/components-react', async () => {
  const actual = await vi.importActual('@livekit/components-react');
  return {
    ...actual,
    useMultibandTrackVolume: vi.fn(() => []),
  };
});

vi.mock('@/hooks/agents-ui/use-agent-audio-visualizer-radial', () => ({
  useAgentAudioVisualizerRadialAnimator: vi.fn(() => []),
}));

describe('AgentAudioVisualizerRadial', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with default props', () => {
      const { container } = render(<AgentAudioVisualizerRadial />);
      const visualizer = container.querySelector('.relative.flex');
      expect(visualizer).toBeInTheDocument();
    });

    it('renders radial bars', () => {
      const { container } = render(<AgentAudioVisualizerRadial />);
      const bars = container.querySelectorAll('[data-lk-index]');
      expect(bars.length).toBeGreaterThan(0);
    });
  });

  describe('Sizes', () => {
    it('applies icon size styles', () => {
      const { container } = render(<AgentAudioVisualizerRadial size="icon" />);
      const visualizer = container.querySelector('.relative.flex');
      expect(visualizer).toHaveClass('h-[24px]');
    });

    it('applies sm size styles', () => {
      const { container } = render(<AgentAudioVisualizerRadial size="sm" />);
      const visualizer = container.querySelector('.relative.flex');
      expect(visualizer).toHaveClass('h-[56px]');
    });

    it('applies md size styles by default', () => {
      const { container } = render(<AgentAudioVisualizerRadial />);
      const visualizer = container.querySelector('.relative.flex');
      expect(visualizer).toHaveClass('h-[112px]');
    });

    it('applies lg size styles', () => {
      const { container } = render(<AgentAudioVisualizerRadial size="lg" />);
      const visualizer = container.querySelector('.relative.flex');
      expect(visualizer).toHaveClass('h-[224px]');
    });

    it('applies xl size styles', () => {
      const { container } = render(<AgentAudioVisualizerRadial size="xl" />);
      const visualizer = container.querySelector('.relative.flex');
      expect(visualizer).toHaveClass('h-[448px]');
    });
  });

  describe('Props', () => {
    it('accepts state prop', () => {
      const { container } = render(<AgentAudioVisualizerRadial state="speaking" />);
      const visualizer = container.querySelector('.relative.flex');
      expect(visualizer).toHaveAttribute('data-lk-state', 'speaking');
    });

    it('accepts barCount prop', () => {
      const { container } = render(<AgentAudioVisualizerRadial barCount={16} />);
      const bars = container.querySelectorAll('[data-lk-index]');
      expect(bars).toHaveLength(16);
    });

    it('accepts radius prop', () => {
      const { container } = render(<AgentAudioVisualizerRadial radius={50} />);
      expect(container.querySelector('.relative.flex')).toBeInTheDocument();
    });

    it('accepts audioTrack prop', () => {
      const mockTrack = {} as any;
      const { container } = render(<AgentAudioVisualizerRadial audioTrack={mockTrack} />);
      expect(container.querySelector('.relative.flex')).toBeInTheDocument();
    });
  });

  describe('HTML Attributes', () => {
    it('accepts and applies className prop', () => {
      const { container } = render(
        <AgentAudioVisualizerRadial className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('accepts and applies style prop', () => {
      const { container } = render(
        <AgentAudioVisualizerRadial style={{ backgroundColor: 'green' }} />
      );
      expect(container.firstChild).toHaveStyle({ backgroundColor: 'green' });
    });

    it('accepts and applies id prop', () => {
      const { container } = render(<AgentAudioVisualizerRadial id="radial-viz" />);
      expect(container.querySelector('#radial-viz')).toBeInTheDocument();
    });

    it('accepts and applies data attributes', () => {
      render(<AgentAudioVisualizerRadial data-testid="custom-radial" />);
      expect(screen.getByTestId('custom-radial')).toBeInTheDocument();
    });
  });

  describe('Bar Attributes', () => {
    it('applies data-lk-index to each bar', () => {
      const { container } = render(<AgentAudioVisualizerRadial barCount={8} />);
      const bars = container.querySelectorAll('[data-lk-index]');
      expect(bars).toHaveLength(8);
      bars.forEach((bar, idx) => {
        expect(bar).toHaveAttribute('data-lk-index', String(idx));
      });
    });

    it('applies data-lk-highlighted attribute', () => {
      const { container } = render(<AgentAudioVisualizerRadial />);
      const bars = container.querySelectorAll('[data-lk-highlighted]');
      expect(bars.length).toBeGreaterThan(0);
    });
  });

  describe('State Styles', () => {
    it('applies thinking state animation', () => {
      const { container } = render(<AgentAudioVisualizerRadial state="thinking" />);
      const visualizer = container.querySelector('.relative.flex');
      expect(visualizer).toHaveAttribute('data-lk-state', 'thinking');
    });

    it('applies listening state', () => {
      const { container } = render(<AgentAudioVisualizerRadial state="listening" />);
      const visualizer = container.querySelector('.relative.flex');
      expect(visualizer).toHaveAttribute('data-lk-state', 'listening');
    });
  });

  describe('Combined Props', () => {
    it('applies size, state, and className together', () => {
      const { container } = render(
        <AgentAudioVisualizerRadial
          size="lg"
          state="speaking"
          barCount={20}
          className="custom-class"
        />
      );
      const visualizer = container.querySelector('.relative.flex');
      expect(visualizer).toHaveClass('custom-class', 'h-[224px]');
      expect(visualizer).toHaveAttribute('data-lk-state', 'speaking');
      const bars = container.querySelectorAll('[data-lk-index]');
      expect(bars).toHaveLength(20);
    });
  });
});
