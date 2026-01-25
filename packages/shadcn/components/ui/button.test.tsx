import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './button';

describe('Button', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: 'Click me' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('data-slot', 'button');
    });

    it('renders children content', () => {
      render(<Button>Test Button</Button>);
      expect(screen.getByText('Test Button')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('applies default variant styles', () => {
      render(<Button variant="default">Default</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary', 'text-primary-foreground');
    });

    it('applies destructive variant styles', () => {
      render(<Button variant="destructive">Destructive</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-destructive', 'text-white');
    });

    it('applies outline variant styles', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border', 'bg-background');
    });

    it('applies secondary variant styles', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-secondary', 'text-secondary-foreground');
    });

    it('applies ghost variant styles', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-accent');
    });

    it('applies link variant styles', () => {
      render(<Button variant="link">Link</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-primary', 'underline-offset-4');
    });
  });

  describe('Sizes', () => {
    it('applies default size styles', () => {
      render(<Button size="default">Default</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-9');
    });

    it('applies sm size styles', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-8');
    });

    it('applies lg size styles', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10');
    });

    it('applies icon size styles', () => {
      render(<Button size="icon">Icon</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('size-9');
    });

    it('applies icon-sm size styles', () => {
      render(<Button size="icon-sm">Icon Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('size-8');
    });

    it('applies icon-lg size styles', () => {
      render(<Button size="icon-lg">Icon Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('size-10');
    });
  });

  describe('HTML Attributes', () => {
    it('accepts and applies className prop', () => {
      render(<Button className="custom-class">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('accepts and applies style prop', () => {
      render(<Button style={{ backgroundColor: 'red' }}>Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ backgroundColor: 'red' });
    });

    it('accepts and applies id prop', () => {
      render(<Button id="test-button">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('id', 'test-button');
    });

    it('accepts and applies data attributes', () => {
      render(<Button data-testid="custom-button">Button</Button>);
      expect(screen.getByTestId('custom-button')).toBeInTheDocument();
    });

    it('accepts and applies aria attributes', () => {
      render(<Button aria-label="Custom Label">Button</Button>);
      const button = screen.getByRole('button', { name: 'Custom Label' });
      expect(button).toBeInTheDocument();
    });

    it('accepts and applies type attribute', () => {
      render(<Button type="submit">Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('accepts and applies disabled attribute', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Event Handlers', () => {
    it('calls onClick handler when clicked', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      render(<Button onClick={handleClick}>Click</Button>);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('calls onMouseEnter handler on hover', async () => {
      const handleMouseEnter = vi.fn();
      const user = userEvent.setup();
      render(<Button onMouseEnter={handleMouseEnter}>Hover</Button>);
      
      const button = screen.getByRole('button');
      await user.hover(button);
      
      expect(handleMouseEnter).toHaveBeenCalled();
    });

    it('calls onMouseLeave handler when unhovered', async () => {
      const handleMouseLeave = vi.fn();
      const user = userEvent.setup();
      render(<Button onMouseLeave={handleMouseLeave}>Unhover</Button>);
      
      const button = screen.getByRole('button');
      await user.hover(button);
      await user.unhover(button);
      
      expect(handleMouseLeave).toHaveBeenCalled();
    });

    it('calls onFocus handler when focused', async () => {
      const handleFocus = vi.fn();
      const user = userEvent.setup();
      render(<Button onFocus={handleFocus}>Focus</Button>);
      
      const button = screen.getByRole('button');
      await user.tab();
      
      expect(handleFocus).toHaveBeenCalled();
    });

    it('calls onBlur handler when blurred', async () => {
      const handleBlur = vi.fn();
      const user = userEvent.setup();
      render(<Button onBlur={handleBlur}>Blur</Button>);
      
      const button = screen.getByRole('button');
      await user.tab();
      await user.tab();
      
      expect(handleBlur).toHaveBeenCalled();
    });

    it('does not call onClick when disabled', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      render(<Button disabled onClick={handleClick}>Disabled</Button>);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('AsChild Prop', () => {
    it('renders as Slot when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );
      
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/test');
    });

    it('applies button styles to child element when asChild is true', () => {
      render(
        <Button asChild className="custom-button">
          <a href="/test">Styled Link</a>
        </Button>
      );
      
      const link = screen.getByRole('link');
      expect(link).toHaveClass('custom-button');
    });
  });

  describe('Combined Props', () => {
    it('applies multiple variant and size combinations', () => {
      render(<Button variant="outline" size="lg">Large Outline</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border', 'h-10');
    });

    it('merges custom className with variant classes', () => {
      render(
        <Button variant="secondary" className="my-custom-class">
          Custom
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-secondary', 'my-custom-class');
    });
  });
});
