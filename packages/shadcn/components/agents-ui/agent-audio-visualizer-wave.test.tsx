import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AgentAudioVisualizerWave } from './agent-audio-visualizer-wave';

// Mock the hooks and components
vi.mock('@/hooks/agents-ui/use-agent-audio-visualizer-wave', () => ({
  useAgentAudioVisualizerWave: vi.fn(() => ({
    frequency: 1.0,
    amplitude: 0.5,
    speed: 1.0,
    lineWidth: 2.0,
    smoothing: 1.0,
    brightness: 1.0,
  })),
}));

vi.mock('@/components/agents-ui/react-shader-toy', () => ({
  ReactShaderToy: ({ className, ...props }: any) => (
    <div data-testid="shader-toy" className={className} {...props} />
  ),
}));

describe('AgentAudioVisualizerWave', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with default props', () => {
      const { container } = render(<AgentAudioVisualizerWave />);
      expect(screen.getByTestId('shader-toy')).toBeInTheDocument();
    });

    it('renders shader component', () => {
      render(<AgentAudioVisualizerWave />);
      const shader = screen.getByTestId('shader-toy');
      expect(shader).toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    it('applies icon size styles', () => {
      const { container } = render(<AgentAudioVisualizerWave size="icon" />);
      const visualizer = container.firstChild;
      expect(visualizer).toHaveClass('h-[24px]');
    });

    it('applies sm size styles', () => {
      const { container } = render(<AgentAudioVisualizerWave size="sm" />);
      const visualizer = container.firstChild;
      expect(visualizer).toHaveClass('h-[56px]');
    });

    it('applies md size styles by default', () => {
      const { container } = render(<AgentAudioVisualizerWave />);
      const visualizer = container.firstChild;
      expect(visualizer).toHaveClass('h-[224px]');
    });

    it('applies lg size styles', () => {
      const { container } = render(<AgentAudioVisualizerWave size="lg" />);
      const visualizer = container.firstChild;
      expect(visualizer).toHaveClass('h-[224px]');
    });

    it('applies xl size styles', () => {
      const { container } = render(<AgentAudioVisualizerWave size="xl" />);
      const visualizer = container.firstChild;
      expect(visualizer).toHaveClass('h-[448px]');
    });
  });

  describe('Props', () => {
    it('accepts state prop', () => {
      const { container } = render(<AgentAudioVisualizerWave state="speaking" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('accepts audioTrack prop', () => {
      const mockTrack = {} as any;
      const { container } = render(<AgentAudioVisualizerWave audioTrack={mockTrack} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('accepts color prop', () => {
      const { container } = render(<AgentAudioVisualizerWave color="#FF0000" />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('HTML Attributes', () => {
    it('accepts and applies className prop', () => {
      const { container } = render(
        <AgentAudioVisualizerWave className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('accepts and applies style prop', () => {
      const { container } = render(
        <AgentAudioVisualizerWave style={{ backgroundColor: 'red' }} />
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('accepts and applies id prop', () => {
      const { container } = render(<AgentAudioVisualizerWave id="wave-viz" />);
      expect(container.querySelector('#wave-viz')).toBeInTheDocument();
    });

    it('accepts and applies data attributes', () => {
      render(<AgentAudioVisualizerWave data-testid="custom-wave" />);
      expect(screen.getByTestId('custom-wave')).toBeInTheDocument();
    });
  });

  describe('Combined Props', () => {
    it('applies size and className together', () => {
      const { container } = render(
        <AgentAudioVisualizerWave size="lg" className="custom-class" />
      );
      const visualizer = container.firstChild;
      expect(visualizer).toHaveClass('h-[224px]', 'custom-class');
    });

    it('handles all props together', () => {
      const { container } = render(
        <AgentAudioVisualizerWave
          size="md"
          state="speaking"
          color="#00FF00"
          className="test-class"
        />
      );
      expect(container.firstChild).toHaveClass('test-class', 'h-[112px]');
    });
  });
});
