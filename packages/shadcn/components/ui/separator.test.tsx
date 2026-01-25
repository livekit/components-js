import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Separator } from './separator';

describe('Separator', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      const { container } = render(<Separator />);
      const separator = container.querySelector('[data-slot="separator"]');
      expect(separator).toBeInTheDocument();
    });

    it('has role separator by default', () => {
      const { container } = render(<Separator />);
      const separator = container.querySelector('[role="separator"]');
      expect(separator).toBeInTheDocument();
    });

    it('is decorative by default', () => {
      const { container } = render(<Separator />);
      const separator = container.querySelector('[data-slot="separator"]');
      expect(separator).toHaveAttribute('aria-orientation', 'horizontal');
    });
  });

  describe('Orientation', () => {
    it('applies horizontal orientation by default', () => {
      const { container } = render(<Separator />);
      const separator = container.querySelector('[data-slot="separator"]');
      expect(separator).toHaveAttribute('data-orientation', 'horizontal');
    });

    it('applies horizontal orientation styles', () => {
      const { container } = render(<Separator orientation="horizontal" />);
      const separator = container.querySelector('[data-slot="separator"]');
      expect(separator).toHaveClass('bg-border');
      expect(separator).toHaveAttribute('data-orientation', 'horizontal');
    });

    it('applies vertical orientation when specified', () => {
      const { container } = render(<Separator orientation="vertical" />);
      const separator = container.querySelector('[data-slot="separator"]');
      expect(separator).toHaveAttribute('data-orientation', 'vertical');
    });

    it('applies vertical orientation styles', () => {
      const { container } = render(<Separator orientation="vertical" />);
      const separator = container.querySelector('[data-slot="separator"]');
      expect(separator).toHaveClass('bg-border');
      expect(separator).toHaveAttribute('data-orientation', 'vertical');
    });
  });

  describe('Decorative Prop', () => {
    it('is decorative by default', () => {
      const { container } = render(<Separator />);
      const separator = container.querySelector('[data-slot="separator"]');
      expect(separator).toHaveAttribute('role', 'none');
    });

    it('applies decorative prop when true', () => {
      const { container } = render(<Separator decorative={true} />);
      const separator = container.querySelector('[data-slot="separator"]');
      expect(separator).toHaveAttribute('role', 'none');
    });

    it('has proper role when not decorative', () => {
      const { container } = render(<Separator decorative={false} />);
      const separator = container.querySelector('[data-slot="separator"]');
      expect(separator).toHaveAttribute('role', 'separator');
    });
  });

  describe('HTML Attributes', () => {
    it('accepts and applies className prop', () => {
      const { container } = render(<Separator className="custom-class" />);
      const separator = container.querySelector('[data-slot="separator"]');
      expect(separator).toHaveClass('custom-class', 'bg-border');
    });

    it('accepts and applies style prop', () => {
      const { container } = render(
        <Separator style={{ backgroundColor: 'red' }} />
      );
      const separator = container.querySelector('[data-slot="separator"]');
      expect(separator).toHaveStyle({ backgroundColor: 'red' });
    });

    it('accepts and applies id prop', () => {
      const { container } = render(<Separator id="test-separator" />);
      const separator = container.querySelector('#test-separator');
      expect(separator).toBeInTheDocument();
    });

    it('accepts and applies data attributes', () => {
      render(<Separator data-testid="custom-separator" />);
      expect(screen.getByTestId('custom-separator')).toBeInTheDocument();
    });

    it('accepts and applies aria attributes', () => {
      const { container } = render(<Separator aria-label="Custom Separator" />);
      const separator = container.querySelector('[aria-label="Custom Separator"]');
      expect(separator).toBeInTheDocument();
    });
  });

  describe('Combined Props', () => {
    it('applies custom className with orientation', () => {
      const { container } = render(
        <Separator orientation="vertical" className="my-custom-class" />
      );
      const separator = container.querySelector('[data-slot="separator"]');
      expect(separator).toHaveClass('my-custom-class', 'bg-border');
      expect(separator).toHaveAttribute('data-orientation', 'vertical');
    });

    it('combines orientation and decorative props', () => {
      const { container } = render(
        <Separator orientation="vertical" decorative={false} />
      );
      const separator = container.querySelector('[data-slot="separator"]');
      expect(separator).toHaveAttribute('data-orientation', 'vertical');
      expect(separator).toHaveAttribute('role', 'separator');
    });
  });
});
