import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AgentChatIndicator } from './agent-chat-indicator';

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

  describe('Sizes', () => {
    it('applies sm size styles', () => {
      render(<AgentChatIndicator size="sm" data-testid="indicator" />);
      const indicator = screen.getByTestId('indicator');
      expect(indicator).toHaveClass('size-2.5');
    });

    it('applies md size styles by default', () => {
      render(<AgentChatIndicator data-testid="indicator" />);
      const indicator = screen.getByTestId('indicator');
      expect(indicator).toHaveClass('size-4');
    });

    it('applies md size styles when specified', () => {
      render(<AgentChatIndicator size="md" data-testid="indicator" />);
      const indicator = screen.getByTestId('indicator');
      expect(indicator).toHaveClass('size-4');
    });

    it('applies lg size styles', () => {
      render(<AgentChatIndicator size="lg" data-testid="indicator" />);
      const indicator = screen.getByTestId('indicator');
      expect(indicator).toHaveClass('size-6');
    });
  });

  describe('HTML Attributes', () => {
    it('accepts and applies className prop', () => {
      render(<AgentChatIndicator className="custom-class" data-testid="indicator" />);
      const indicator = screen.getByTestId('indicator');
      expect(indicator).toHaveClass('custom-class', 'bg-muted-foreground');
    });

    it('accepts and applies style prop', () => {
      render(<AgentChatIndicator style={{ backgroundColor: 'red' }} data-testid="indicator" />);
      const indicator = screen.getByTestId('indicator');
      expect(indicator).toBeInTheDocument();
    });

    it('accepts and applies id prop', () => {
      render(<AgentChatIndicator id="test-indicator" />);
      const indicator = document.querySelector('#test-indicator');
      expect(indicator).toBeInTheDocument();
    });

    it('accepts and applies data attributes', () => {
      render(<AgentChatIndicator data-testid="custom-indicator" />);
      expect(screen.getByTestId('custom-indicator')).toBeInTheDocument();
    });

    it('accepts and applies aria attributes', () => {
      render(<AgentChatIndicator aria-label="Loading indicator" data-testid="indicator" />);
      const indicator = screen.getByTestId('indicator');
      expect(indicator).toHaveAttribute('aria-label', 'Loading indicator');
    });
  });

  describe('Animation Props', () => {
    it('accepts motion props', () => {
      render(<AgentChatIndicator initial={{ opacity: 0 }} data-testid="indicator" />);
      const indicator = screen.getByTestId('indicator');
      expect(indicator).toBeInTheDocument();
    });

    it('accepts transition props', () => {
      render(
        <AgentChatIndicator
          transition={{ duration: 1.0 }}
          data-testid="indicator"
        />
      );
      const indicator = screen.getByTestId('indicator');
      expect(indicator).toBeInTheDocument();
    });
  });

  describe('Combined Props', () => {
    it('applies multiple size and className combinations', () => {
      render(
        <AgentChatIndicator
          size="lg"
          className="my-custom-class"
          data-testid="indicator"
        />
      );
      const indicator = screen.getByTestId('indicator');
      expect(indicator).toHaveClass('size-6', 'my-custom-class');
    });

    it('merges custom className with default classes', () => {
      render(
        <AgentChatIndicator
          className="custom-bg"
          data-testid="indicator"
        />
      );
      const indicator = screen.getByTestId('indicator');
      expect(indicator).toHaveClass('custom-bg', 'rounded-full');
    });
  });
});
