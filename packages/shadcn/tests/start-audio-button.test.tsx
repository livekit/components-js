import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StartAudioButton } from '@/components/agents-ui/start-audio-button';
import * as LiveKitComponents from '@livekit/components-react';

// Mock the @livekit/components-react hooks
vi.mock('@livekit/components-react', async () => {
  const actual = await vi.importActual('@livekit/components-react');
  return {
    ...actual,
    useEnsureRoom: vi.fn(() => null),
    useStartAudio: vi.fn(() => ({ mergedProps: {} })),
  };
});

describe('StartAudioButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with required label prop', () => {
      render(<StartAudioButton label="Start Audio" />);
      const button = screen.getByRole('button', { name: 'Start Audio' });
      expect(button).toBeInTheDocument();
    });

    it('displays label text', () => {
      render(<StartAudioButton label="Click to allow audio" />);
      expect(screen.getByText('Click to allow audio')).toBeInTheDocument();
    });

    it('renders as a button element', () => {
      render(<StartAudioButton label="Start" />);
      const button = screen.getByRole('button');
      expect(button.tagName).toBe('BUTTON');
    });
  });

  describe('Size Variants', () => {
    it('applies default size by default', () => {
      render(<StartAudioButton label="Start" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-9');
    });

    it('applies sm size', () => {
      render(<StartAudioButton label="Start" size="sm" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-8');
    });

    it('applies lg size', () => {
      render(<StartAudioButton label="Start" size="lg" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10');
    });

    it('applies icon size', () => {
      render(<StartAudioButton label="Start" size="icon" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('size-9');
    });

    it('applies icon-sm size', () => {
      render(<StartAudioButton label="Start" size="icon-sm" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('size-8');
    });

    it('applies icon-lg size', () => {
      render(<StartAudioButton label="Start" size="icon-lg" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('size-10');
    });
  });

  describe('Variant Styles', () => {
    it('applies default variant by default', () => {
      render(<StartAudioButton label="Start" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary');
    });

    it('applies destructive variant', () => {
      render(<StartAudioButton label="Start" variant="destructive" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-destructive');
    });

    it('applies outline variant', () => {
      render(<StartAudioButton label="Start" variant="outline" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border', 'bg-background');
    });

    it('applies secondary variant', () => {
      render(<StartAudioButton label="Start" variant="secondary" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-secondary');
    });

    it('applies ghost variant', () => {
      render(<StartAudioButton label="Start" variant="ghost" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-accent');
    });

    it('applies link variant', () => {
      render(<StartAudioButton label="Start" variant="link" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-primary', 'underline-offset-4');
    });
  });

  describe('HTML Attributes', () => {
    it('accepts and applies className prop', () => {
      render(<StartAudioButton label="Start" className="custom-class" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('accepts and applies style prop', () => {
      render(<StartAudioButton label="Start" style={{ backgroundColor: 'blue' }} />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('accepts and applies id prop', () => {
      render(<StartAudioButton label="Start" id="start-btn" />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('id', 'start-btn');
    });

    it('accepts and applies data attributes', () => {
      render(<StartAudioButton label="Start" data-testid="custom-button" />);
      expect(screen.getByTestId('custom-button')).toBeInTheDocument();
    });

    it('accepts and applies aria attributes', () => {
      render(<StartAudioButton label="Start" aria-describedby="audio-desc" />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-describedby', 'audio-desc');
    });

    it('accepts and applies type attribute', () => {
      render(<StartAudioButton label="Start" type="submit" />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('accepts and applies disabled attribute', () => {
      render(<StartAudioButton label="Start" disabled />);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Event Handlers', () => {
    it('calls onClick handler when clicked', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      vi.mocked(LiveKitComponents.useStartAudio).mockReturnValue({
        mergedProps: { onClick: handleClick },
      });

      render(<StartAudioButton label="Start" />);
      const button = screen.getByRole('button');
      await user.click(button);

      expect(handleClick).toHaveBeenCalled();
    });

    it('does not call onClick when disabled', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      vi.mocked(LiveKitComponents.useStartAudio).mockReturnValue({
        mergedProps: { onClick: handleClick },
      });

      render(<StartAudioButton label="Start" disabled />);
      const button = screen.getByRole('button');
      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Room Integration', () => {
    it('calls useEnsureRoom with provided room', () => {
      const mockRoom = {} as any;
      render(<StartAudioButton label="Start" room={mockRoom} />);

      expect(LiveKitComponents.useEnsureRoom).toHaveBeenCalledWith(mockRoom);
    });

    it('calls useEnsureRoom with undefined when no room provided', () => {
      render(<StartAudioButton label="Start" />);

      expect(LiveKitComponents.useEnsureRoom).toHaveBeenCalledWith(undefined);
    });

    it('calls useStartAudio with ensured room', () => {
      const mockRoom = {} as any;
      vi.mocked(LiveKitComponents.useEnsureRoom).mockReturnValue(mockRoom);

      render(<StartAudioButton label="Start" room={mockRoom} />);

      expect(LiveKitComponents.useStartAudio).toHaveBeenCalledWith({
        room: mockRoom,
        props: expect.any(Object),
      });
    });
  });

  describe('Combined Props', () => {
    it('applies multiple variant and size combinations', () => {
      render(<StartAudioButton label="Start" variant="outline" size="lg" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border', 'h-10');
    });

    it('merges custom className with variant classes', () => {
      render(<StartAudioButton label="Start" variant="secondary" className="my-custom-class" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-secondary', 'my-custom-class');
    });
  });
});
