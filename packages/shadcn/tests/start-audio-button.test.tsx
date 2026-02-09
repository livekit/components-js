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
    it('renders as a button element', () => {
      render(<StartAudioButton label="Start" />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('renders the label prop', () => {
      render(<StartAudioButton label="Start Audio" />);
      const button = screen.getByRole('button', { name: 'Start Audio' });
      expect(button).toBeInTheDocument();
    });
  });

  describe('HTML Attributes', () => {
    it('accepts and applies id prop', () => {
      render(<StartAudioButton label="Start" id="start-btn" />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('id', 'start-btn');
    });

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
        mergedProps: { className: '', style: { display: 'block' }, onClick: handleClick },
        canPlayAudio: true,
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
        mergedProps: { className: '', style: { display: 'block' }, onClick: handleClick },
        canPlayAudio: true,
      });

      render(<StartAudioButton label="Start" disabled />);
      const button = screen.getByRole('button');
      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('calls onFocus and onBlur handlers', async () => {
      const handleFocus = vi.fn();
      const handleBlur = vi.fn();
      const user = userEvent.setup();
      render(<StartAudioButton label="Start" onFocus={handleFocus} onBlur={handleBlur} />);
      await user.tab();
      expect(handleFocus).toHaveBeenCalledTimes(1);
      await user.tab();
      expect(handleBlur).toHaveBeenCalledTimes(1);
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
});
