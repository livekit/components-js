import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toggle } from './toggle';

describe('Toggle', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<Toggle>Toggle me</Toggle>);
      const toggle = screen.getByRole('button', { name: 'Toggle me' });
      expect(toggle).toBeInTheDocument();
      expect(toggle).toHaveAttribute('data-slot', 'toggle');
    });

    it('renders children content', () => {
      render(<Toggle>Test Toggle</Toggle>);
      expect(screen.getByText('Test Toggle')).toBeInTheDocument();
    });

    it('has aria-pressed attribute', () => {
      render(<Toggle>Toggle</Toggle>);
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveAttribute('aria-pressed');
    });
  });

  describe('Variants', () => {
    it('applies default variant styles', () => {
      render(<Toggle variant="default">Default</Toggle>);
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveClass('bg-transparent');
    });

    it('applies outline variant styles', () => {
      render(<Toggle variant="outline">Outline</Toggle>);
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveClass('border', 'border-input');
    });
  });

  describe('Sizes', () => {
    it('applies default size styles', () => {
      render(<Toggle size="default">Default</Toggle>);
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveClass('h-9');
    });

    it('applies sm size styles', () => {
      render(<Toggle size="sm">Small</Toggle>);
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveClass('h-8');
    });

    it('applies lg size styles', () => {
      render(<Toggle size="lg">Large</Toggle>);
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveClass('h-10');
    });
  });

  describe('Pressed State', () => {
    it('renders in default unpressed state', () => {
      render(<Toggle>Toggle</Toggle>);
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveAttribute('aria-pressed', 'false');
    });

    it('renders in pressed state when pressed prop is true', () => {
      render(<Toggle pressed={true}>Pressed</Toggle>);
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveAttribute('aria-pressed', 'true');
      expect(toggle).toHaveAttribute('data-state', 'on');
    });

    it('renders in unpressed state when pressed prop is false', () => {
      render(<Toggle pressed={false}>Not Pressed</Toggle>);
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveAttribute('aria-pressed', 'false');
      expect(toggle).toHaveAttribute('data-state', 'off');
    });

    it('toggles state when clicked', async () => {
      const user = userEvent.setup();
      render(<Toggle>Toggle</Toggle>);
      
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveAttribute('aria-pressed', 'false');
      
      await user.click(toggle);
      expect(toggle).toHaveAttribute('aria-pressed', 'true');
      
      await user.click(toggle);
      expect(toggle).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('HTML Attributes', () => {
    it('accepts and applies className prop', () => {
      render(<Toggle className="custom-class">Toggle</Toggle>);
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveClass('custom-class');
    });

    it('accepts and applies style prop', () => {
      render(<Toggle style={{ backgroundColor: 'blue' }}>Toggle</Toggle>);
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveStyle({ backgroundColor: 'blue' });
    });

    it('accepts and applies id prop', () => {
      render(<Toggle id="test-toggle">Toggle</Toggle>);
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveAttribute('id', 'test-toggle');
    });

    it('accepts and applies data attributes', () => {
      render(<Toggle data-testid="custom-toggle">Toggle</Toggle>);
      expect(screen.getByTestId('custom-toggle')).toBeInTheDocument();
    });

    it('accepts and applies aria attributes', () => {
      render(<Toggle aria-label="Custom Toggle">Toggle</Toggle>);
      const toggle = screen.getByRole('button', { name: 'Custom Toggle' });
      expect(toggle).toBeInTheDocument();
    });

    it('accepts and applies disabled attribute', () => {
      render(<Toggle disabled>Disabled</Toggle>);
      const toggle = screen.getByRole('button');
      expect(toggle).toBeDisabled();
    });
  });

  describe('Event Handlers', () => {
    it('calls onPressedChange handler when toggled', async () => {
      const handlePressedChange = vi.fn();
      const user = userEvent.setup();
      render(<Toggle onPressedChange={handlePressedChange}>Toggle</Toggle>);
      
      const toggle = screen.getByRole('button');
      await user.click(toggle);
      
      expect(handlePressedChange).toHaveBeenCalledWith(true);
      
      await user.click(toggle);
      expect(handlePressedChange).toHaveBeenCalledWith(false);
    });

    it('calls onClick handler when clicked', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      render(<Toggle onClick={handleClick}>Toggle</Toggle>);
      
      const toggle = screen.getByRole('button');
      await user.click(toggle);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('calls onMouseEnter handler on hover', async () => {
      const handleMouseEnter = vi.fn();
      const user = userEvent.setup();
      render(<Toggle onMouseEnter={handleMouseEnter}>Toggle</Toggle>);
      
      const toggle = screen.getByRole('button');
      await user.hover(toggle);
      
      expect(handleMouseEnter).toHaveBeenCalled();
    });

    it('calls onFocus handler when focused', async () => {
      const handleFocus = vi.fn();
      const user = userEvent.setup();
      render(<Toggle onFocus={handleFocus}>Toggle</Toggle>);
      
      const toggle = screen.getByRole('button');
      await user.tab();
      
      expect(handleFocus).toHaveBeenCalled();
    });

    it('does not call handlers when disabled', async () => {
      const handleClick = vi.fn();
      const handlePressedChange = vi.fn();
      const user = userEvent.setup();
      render(
        <Toggle disabled onClick={handleClick} onPressedChange={handlePressedChange}>
          Disabled
        </Toggle>
      );
      
      const toggle = screen.getByRole('button');
      await user.click(toggle);
      
      expect(handleClick).not.toHaveBeenCalled();
      expect(handlePressedChange).not.toHaveBeenCalled();
    });
  });

  describe('Controlled Component', () => {
    it('works as controlled component with pressed prop', async () => {
      const handlePressedChange = vi.fn();
      const user = userEvent.setup();
      
      const { rerender } = render(
        <Toggle pressed={false} onPressedChange={handlePressedChange}>
          Controlled
        </Toggle>
      );
      
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveAttribute('aria-pressed', 'false');
      
      await user.click(toggle);
      expect(handlePressedChange).toHaveBeenCalledWith(true);
      
      // Rerender with new pressed value
      rerender(
        <Toggle pressed={true} onPressedChange={handlePressedChange}>
          Controlled
        </Toggle>
      );
      
      expect(toggle).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Combined Props', () => {
    it('applies multiple variant and size combinations', () => {
      render(<Toggle variant="outline" size="lg">Large Outline</Toggle>);
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveClass('border', 'h-10');
    });

    it('merges custom className with variant classes', () => {
      render(
        <Toggle variant="default" className="my-custom-class">
          Custom
        </Toggle>
      );
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveClass('bg-transparent', 'my-custom-class');
    });
  });
});
