import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AgentAudioVisualizerGrid } from '@/components/agents-ui/agent-audio-visualizer-grid';

// Mock hooks
vi.mock('@livekit/components-react', async () => {
  const actual = await vi.importActual('@livekit/components-react');
  return {
    ...actual,
    useMultibandTrackVolume: vi.fn(() => []),
  };
});

vi.mock('@/hooks/agents-ui/use-agent-audio-visualizer-grid', () => ({
  useAgentAudioVisualizerGridAnimator: vi.fn(() => []),
}));

describe('AgentAudioVisualizerGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with default props', () => {
      const { container } = render(<AgentAudioVisualizerGrid />);
      const visualizer = container.querySelector('.grid');
      expect(visualizer).toBeInTheDocument();
    });

    it('renders with default grid size', () => {
      const { container } = render(<AgentAudioVisualizerGrid />);
      const cells = container.querySelectorAll('[data-lk-index]');
      expect(cells.length).toBeGreaterThan(0);
    });
  });

  describe('Sizes', () => {
    it('applies icon size styles', () => {
      const { container } = render(<AgentAudioVisualizerGrid size="icon" />);
      const visualizer = container.querySelector('.grid');
      expect(visualizer).toHaveClass('gap-[2px]');
    });

    it('applies sm size styles', () => {
      const { container } = render(<AgentAudioVisualizerGrid size="sm" />);
      const visualizer = container.querySelector('.grid');
      expect(visualizer).toHaveClass('gap-[4px]');
    });

    it('applies md size styles by default', () => {
      const { container } = render(<AgentAudioVisualizerGrid />);
      const visualizer = container.querySelector('.grid');
      expect(visualizer).toHaveClass('gap-[8px]');
    });

    it('applies lg size styles', () => {
      const { container } = render(<AgentAudioVisualizerGrid size="lg" />);
      const visualizer = container.querySelector('.grid');
      expect(visualizer).toHaveClass('gap-[12px]');
    });

    it('applies xl size styles', () => {
      const { container } = render(<AgentAudioVisualizerGrid size="xl" />);
      const visualizer = container.querySelector('.grid');
      expect(visualizer).toHaveClass('gap-[16px]');
    });
  });

  describe('Grid Options', () => {
    it('accepts rowCount option', () => {
      const { container } = render(<AgentAudioVisualizerGrid rowCount={3} />);
      expect(container.querySelector('.grid')).toBeInTheDocument();
    });

    it('accepts columnCount option', () => {
      const { container } = render(<AgentAudioVisualizerGrid columnCount={4} />);
      expect(container.querySelector('.grid')).toBeInTheDocument();
    });

    it('accepts radius option', () => {
      const { container } = render(<AgentAudioVisualizerGrid radius={2} />);
      expect(container.querySelector('.grid')).toBeInTheDocument();
    });

    it('accepts interval option', () => {
      const { container } = render(<AgentAudioVisualizerGrid interval={200} />);
      expect(container.querySelector('.grid')).toBeInTheDocument();
    });
  });

  describe('State', () => {
    it('accepts state prop', () => {
      const { container } = render(<AgentAudioVisualizerGrid state="speaking" />);
      expect(container.querySelector('.grid')).toBeInTheDocument();
    });

    it('applies default state', () => {
      const { container } = render(<AgentAudioVisualizerGrid />);
      expect(container.querySelector('.grid')).toBeInTheDocument();
    });
  });

  describe('HTML Attributes', () => {
    it('accepts and applies className prop', () => {
      const { container } = render(<AgentAudioVisualizerGrid className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('accepts and applies style prop', () => {
      const { container } = render(
        <AgentAudioVisualizerGrid style={{ backgroundColor: 'blue' }} />,
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('accepts and applies id prop', () => {
      const { container } = render(<AgentAudioVisualizerGrid id="grid-viz" />);
      expect(container.querySelector('#grid-viz')).toBeInTheDocument();
    });

    it('accepts and applies data attributes', () => {
      render(<AgentAudioVisualizerGrid data-testid="custom-grid" />);
      expect(screen.getByTestId('custom-grid')).toBeInTheDocument();
    });
  });

  describe('Custom Children', () => {
    it('renders with custom children', () => {
      const { container } = render(
        <AgentAudioVisualizerGrid>
          <div className="custom-cell">Cell</div>
        </AgentAudioVisualizerGrid>,
      );
      expect(container.querySelector('.grid')).toBeInTheDocument();
    });
  });

  describe('Audio Track', () => {
    it('accepts audioTrack prop', () => {
      const mockTrack = {} as any;
      const { container } = render(<AgentAudioVisualizerGrid audioTrack={mockTrack} />);
      expect(container.querySelector('.grid')).toBeInTheDocument();
    });
  });

  describe('Combined Props', () => {
    it('applies size, state, and className together', () => {
      const { container } = render(
        <AgentAudioVisualizerGrid
          size="lg"
          state="listening"
          className="custom-class"
          rowCount={4}
          columnCount={4}
        />,
      );
      const visualizer = container.querySelector('.grid');
      expect(visualizer).toHaveClass('custom-class', 'gap-[12px]');
    });
  });
});
