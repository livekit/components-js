import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentChatIndicator } from '@/components/agents-ui/agent-chat-indicator';

describe('AgentChatIndicator', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      const { container } = render(<AgentChatIndicator />);
      const indicator = container.querySelector('span');
      expect(indicator).toBeInTheDocument();
    });

    it('renders children content', () => {
      render(<AgentChatIndicator>Test content</AgentChatIndicator>);
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('renders as a motion.span element', () => {
      render(<AgentChatIndicator data-testid="indicator" />);
      const indicator = screen.getByTestId('indicator');
      expect(indicator).toBeInTheDocument();
      expect(indicator.tagName).toBe('SPAN');
    });
  });

  describe('HTML Attributes', () => {
    it('applies html attributes (id, class, style, aria)', () => {
      render(
        <AgentChatIndicator
          id="test-indicator"
          className="custom-class"
          style={{ borderWidth: '1px' }}
          aria-label="Loading indicator"
        />,
      );
      const indicator = screen.getByLabelText('Loading indicator');
      expect(indicator).toHaveAttribute('id', 'test-indicator');
      expect(indicator).toHaveClass('custom-class');
      expect(indicator).toHaveStyle({ borderWidth: '1px' });
    });
  });

  describe('Event Handlers', () => {
    it('applies click handler', () => {
      const onClick = vi.fn();
      render(<AgentChatIndicator data-testid="indicator" onClick={onClick} />);
      const indicator = screen.getByTestId('indicator');
      fireEvent.click(indicator);
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });
});
