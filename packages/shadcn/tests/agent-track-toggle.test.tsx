import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgentTrackToggle } from '@/components/agents-ui/agent-track-toggle';

describe('AgentTrackToggle', () => {
  describe('Rendering', () => {
    it('renders with required source prop', () => {
      render(<AgentTrackToggle source="microphone" />);
      const toggle = screen.getByRole('button');
      expect(toggle).toBeInTheDocument();
    });

    it('has aria-label with source name', () => {
      render(<AgentTrackToggle source="microphone" />);
      const toggle = screen.getByRole('button', { name: /toggle microphone/i });
      expect(toggle).toBeInTheDocument();
    });

    it('renders children content', () => {
      render(<AgentTrackToggle source="camera">Test</AgentTrackToggle>);
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });

  describe('Source Icons', () => {
    it('shows microphone icon when source is microphone and pressed', () => {
      const { container } = render(<AgentTrackToggle source="microphone" pressed={true} />);
      const button = screen.getByRole('button');
      // The icon is rendered inside the button
      expect(button.querySelector('svg')).toBeInTheDocument();
    });

    it('shows microphone-off icon when source is microphone and not pressed', () => {
      const { container } = render(<AgentTrackToggle source="microphone" pressed={false} />);
      const button = screen.getByRole('button');
      expect(button.querySelector('svg')).toBeInTheDocument();
    });

    it('shows camera icon when source is camera and pressed', () => {
      const { container } = render(<AgentTrackToggle source="camera" pressed={true} />);
      const button = screen.getByRole('button');
      expect(button.querySelector('svg')).toBeInTheDocument();
    });

    it('shows monitor icon when source is screen_share', () => {
      const { container } = render(<AgentTrackToggle source="screen_share" pressed={true} />);
      const button = screen.getByRole('button');
      expect(button.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Pending State', () => {
    it('shows loading icon when pending is true', () => {
      const { container } = render(<AgentTrackToggle source="microphone" pending={true} />);
      const button = screen.getByRole('button');
      const icon = button.querySelector('svg');
      expect(icon).toHaveClass('animate-spin');
    });

    it('does not show loading animation when pending is false', () => {
      const { container } = render(<AgentTrackToggle source="microphone" pending={false} />);
      const button = screen.getByRole('button');
      const icon = button.querySelector('svg');
      expect(icon).not.toHaveClass('animate-spin');
    });
  });

  describe('Pressed State', () => {
    it('is not pressed by default', () => {
      render(<AgentTrackToggle source="microphone" />);
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveAttribute('aria-pressed', 'false');
    });

    it('is pressed when pressed prop is true', () => {
      render(<AgentTrackToggle source="microphone" pressed={true} />);
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveAttribute('aria-pressed', 'true');
    });

    it('respects defaultPressed prop', () => {
      render(<AgentTrackToggle source="microphone" defaultPressed={true} />);
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Variants', () => {
    it('applies default variant by default', () => {
      render(<AgentTrackToggle source="microphone" />);
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveClass('bg-transparent');
    });

    it('applies outline variant', () => {
      render(<AgentTrackToggle source="microphone" variant="outline" />);
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveClass('border');
    });
  });

  describe('Sizes', () => {
    it('applies default size by default', () => {
      render(<AgentTrackToggle source="microphone" />);
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveClass('h-9');
    });

    it('applies sm size', () => {
      render(<AgentTrackToggle source="microphone" size="sm" />);
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveClass('h-8');
    });

    it('applies lg size', () => {
      render(<AgentTrackToggle source="microphone" size="lg" />);
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveClass('h-10');
    });
  });

  describe('HTML Attributes', () => {
    it('accepts and applies className prop', () => {
      render(<AgentTrackToggle source="microphone" className="custom-class" />);
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveClass('custom-class');
    });

    it('accepts and applies style prop', () => {
      render(<AgentTrackToggle source="microphone" style={{ backgroundColor: 'red' }} />);
      const toggle = screen.getByRole('button');
      expect(toggle).toBeInTheDocument();
    });

    it('accepts and applies id prop', () => {
      render(<AgentTrackToggle source="microphone" id="toggle-id" />);
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveAttribute('id', 'toggle-id');
    });

    it('accepts and applies data attributes', () => {
      render(<AgentTrackToggle source="microphone" data-testid="custom-toggle" />);
      expect(screen.getByTestId('custom-toggle')).toBeInTheDocument();
    });

    it('accepts and applies disabled attribute', () => {
      render(<AgentTrackToggle source="microphone" disabled />);
      const toggle = screen.getByRole('button');
      expect(toggle).toBeDisabled();
    });
  });

  describe('Event Handlers', () => {
    it('calls onPressedChange when toggled', async () => {
      const handlePressedChange = vi.fn();
      const user = userEvent.setup();

      render(<AgentTrackToggle source="microphone" onPressedChange={handlePressedChange} />);

      const toggle = screen.getByRole('button');
      await user.click(toggle);

      expect(handlePressedChange).toHaveBeenCalledWith(true);
    });

    it('calls onClick handler when clicked', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<AgentTrackToggle source="microphone" onClick={handleClick} />);

      const toggle = screen.getByRole('button');
      await user.click(toggle);

      expect(handleClick).toHaveBeenCalled();
    });

    it('does not call handlers when disabled', async () => {
      const handlePressedChange = vi.fn();
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <AgentTrackToggle
          source="microphone"
          disabled
          onClick={handleClick}
          onPressedChange={handlePressedChange}
        />,
      );

      const toggle = screen.getByRole('button');
      await user.click(toggle);

      expect(handleClick).not.toHaveBeenCalled();
      expect(handlePressedChange).not.toHaveBeenCalled();
    });
  });

  describe('Combined Props', () => {
    it('applies multiple props together', () => {
      render(
        <AgentTrackToggle
          source="camera"
          variant="outline"
          size="lg"
          pressed={true}
          className="custom-class"
        />,
      );

      const toggle = screen.getByRole('button');
      expect(toggle).toHaveClass('custom-class', 'border', 'h-10');
      expect(toggle).toHaveAttribute('aria-pressed', 'true');
    });

    it('works with pending and pressed states together', () => {
      const { container } = render(
        <AgentTrackToggle source="microphone" pressed={true} pending={true} />,
      );

      const toggle = screen.getByRole('button');
      expect(toggle).toHaveAttribute('aria-pressed', 'true');

      const icon = container.querySelector('svg');
      expect(icon).toHaveClass('animate-spin');
    });
  });
});
