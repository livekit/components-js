import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgentDisconnectButton } from './agent-disconnect-button';
import * as LiveKitComponents from '@livekit/components-react';

// Mock the @livekit/components-react hooks
vi.mock('@livekit/components-react', async () => {
  const actual = await vi.importActual('@livekit/components-react');
  return {
    ...actual,
    useSessionContext: vi.fn(() => ({ end: vi.fn() })),
  };
});

describe('AgentDisconnectButton', () => {
  const mockEnd = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(LiveKitComponents.useSessionContext).mockReturnValue({
      end: mockEnd,
    } as any);
  });

  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<AgentDisconnectButton />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('displays default END CALL text', () => {
      render(<AgentDisconnectButton />);
      expect(screen.getByText('END CALL')).toBeInTheDocument();
    });

    it('displays custom children when provided', () => {
      render(<AgentDisconnectButton>Custom Text</AgentDisconnectButton>);
      expect(screen.getByText('Custom Text')).toBeInTheDocument();
      expect(screen.queryByText('END CALL')).not.toBeInTheDocument();
    });

    it('renders with default phone icon', () => {
      const { container } = render(<AgentDisconnectButton />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('renders with custom icon when provided', () => {
      render(
        <AgentDisconnectButton icon={<span data-testid="custom-icon">X</span>} />
      );
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('applies default size by default', () => {
      render(<AgentDisconnectButton />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-9');
    });

    it('applies sm size', () => {
      render(<AgentDisconnectButton size="sm" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-8');
    });

    it('applies lg size', () => {
      render(<AgentDisconnectButton size="lg" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10');
    });

    it('applies icon size', () => {
      render(<AgentDisconnectButton size="icon" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('size-9');
    });

    it('hides text with sr-only when icon size', () => {
      render(<AgentDisconnectButton size="icon" />);
      const text = screen.getByText('END CALL');
      expect(text).toHaveClass('sr-only');
    });
  });

  describe('Variant Styles', () => {
    it('applies destructive variant by default', () => {
      render(<AgentDisconnectButton />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-destructive');
    });

    it('applies default variant', () => {
      render(<AgentDisconnectButton variant="default" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary');
    });

    it('applies outline variant', () => {
      render(<AgentDisconnectButton variant="outline" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border', 'bg-background');
    });

    it('applies ghost variant', () => {
      render(<AgentDisconnectButton variant="ghost" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-accent');
    });

    it('applies link variant', () => {
      render(<AgentDisconnectButton variant="link" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-primary');
    });
  });

  describe('HTML Attributes', () => {
    it('accepts and applies className prop', () => {
      render(<AgentDisconnectButton className="custom-class" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('accepts and applies style prop', () => {
      render(<AgentDisconnectButton style={{ backgroundColor: 'blue' }} />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('accepts and applies id prop', () => {
      render(<AgentDisconnectButton id="disconnect-btn" />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('id', 'disconnect-btn');
    });

    it('accepts and applies data attributes', () => {
      render(<AgentDisconnectButton data-testid="custom-button" />);
      expect(screen.getByTestId('custom-button')).toBeInTheDocument();
    });

    it('accepts and applies aria attributes', () => {
      render(<AgentDisconnectButton aria-label="Disconnect session" />);
      const button = screen.getByRole('button', { name: 'Disconnect session' });
      expect(button).toBeInTheDocument();
    });

    it('accepts and applies disabled attribute', () => {
      render(<AgentDisconnectButton disabled />);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Event Handlers', () => {
    it('calls end from useSessionContext when clicked', async () => {
      const user = userEvent.setup();
      render(<AgentDisconnectButton />);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(mockEnd).toHaveBeenCalledTimes(1);
    });

    it('calls custom onClick handler when provided', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      render(<AgentDisconnectButton onClick={handleClick} />);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('calls both onClick and end when clicked', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      render(<AgentDisconnectButton onClick={handleClick} />);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(mockEnd).toHaveBeenCalledTimes(1);
    });

    it('does not call handlers when disabled', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      render(<AgentDisconnectButton disabled onClick={handleClick} />);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
      expect(mockEnd).not.toHaveBeenCalled();
    });
  });

  describe('Combined Props', () => {
    it('applies multiple props together', () => {
      render(
        <AgentDisconnectButton
          variant="outline"
          size="lg"
          className="custom-class"
        >
          Leave
        </AgentDisconnectButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class', 'border', 'h-10');
      expect(screen.getByText('Leave')).toBeInTheDocument();
    });
  });

  describe('Session Integration', () => {
    it('uses session context end method', () => {
      render(<AgentDisconnectButton />);
      expect(LiveKitComponents.useSessionContext).toHaveBeenCalled();
    });

    it('handles missing session context gracefully', async () => {
      vi.mocked(LiveKitComponents.useSessionContext).mockReturnValue({
        end: undefined,
      } as any);

      const user = userEvent.setup();
      render(<AgentDisconnectButton />);

      const button = screen.getByRole('button');
      await expect(user.click(button)).resolves.toBeUndefined();
    });
  });
});
