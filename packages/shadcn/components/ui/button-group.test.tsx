import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from './button-group';

describe('ButtonGroup', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      const { container } = render(<ButtonGroup>Content</ButtonGroup>);
      const group = container.querySelector('[data-slot="button-group"]');
      expect(group).toBeInTheDocument();
    });

    it('has role group', () => {
      render(<ButtonGroup>Content</ButtonGroup>);
      const group = screen.getByRole('group');
      expect(group).toBeInTheDocument();
    });

    it('renders children content', () => {
      render(<ButtonGroup>Test content</ButtonGroup>);
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });
  });

  describe('Orientation', () => {
    it('applies horizontal orientation by default', () => {
      const { container } = render(<ButtonGroup>Content</ButtonGroup>);
      const group = container.querySelector('[data-slot="button-group"]');
      expect(group).toHaveAttribute('data-orientation', 'horizontal');
    });

    it('applies horizontal orientation styles', () => {
      const { container } = render(<ButtonGroup orientation="horizontal">Content</ButtonGroup>);
      const group = container.querySelector('[data-slot="button-group"]');
      expect(group).toHaveClass('flex');
      expect(group).not.toHaveClass('flex-col');
    });

    it('applies vertical orientation when specified', () => {
      const { container } = render(<ButtonGroup orientation="vertical">Content</ButtonGroup>);
      const group = container.querySelector('[data-slot="button-group"]');
      expect(group).toHaveAttribute('data-orientation', 'vertical');
    });

    it('applies vertical orientation styles', () => {
      const { container } = render(<ButtonGroup orientation="vertical">Content</ButtonGroup>);
      const group = container.querySelector('[data-slot="button-group"]');
      expect(group).toHaveClass('flex-col');
    });
  });

  describe('HTML Attributes', () => {
    it('accepts and applies className prop', () => {
      const { container } = render(<ButtonGroup className="custom-class">Content</ButtonGroup>);
      const group = container.querySelector('[data-slot="button-group"]');
      expect(group).toHaveClass('custom-class', 'flex');
    });

    it('accepts and applies style prop', () => {
      const { container } = render(
        <ButtonGroup style={{ backgroundColor: 'red' }}>Content</ButtonGroup>
      );
      const group = container.querySelector('[data-slot="button-group"]');
      expect(group).toHaveStyle({ backgroundColor: 'red' });
    });

    it('accepts and applies id prop', () => {
      const { container } = render(<ButtonGroup id="test-group">Content</ButtonGroup>);
      const group = container.querySelector('#test-group');
      expect(group).toBeInTheDocument();
    });

    it('accepts and applies data attributes', () => {
      render(<ButtonGroup data-testid="custom-group">Content</ButtonGroup>);
      expect(screen.getByTestId('custom-group')).toBeInTheDocument();
    });

    it('accepts and applies aria attributes', () => {
      const { container } = render(
        <ButtonGroup aria-label="Custom Group">Content</ButtonGroup>
      );
      const group = container.querySelector('[aria-label="Custom Group"]');
      expect(group).toBeInTheDocument();
    });
  });

  describe('Combined Props', () => {
    it('applies custom className with orientation', () => {
      const { container } = render(
        <ButtonGroup orientation="vertical" className="my-custom-class">
          Content
        </ButtonGroup>
      );
      const group = container.querySelector('[data-slot="button-group"]');
      expect(group).toHaveClass('my-custom-class', 'flex-col');
    });
  });
});

describe('ButtonGroupText', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<ButtonGroupText>Text</ButtonGroupText>);
      expect(screen.getByText('Text')).toBeInTheDocument();
    });

    it('applies default styling', () => {
      const { container } = render(<ButtonGroupText>Text</ButtonGroupText>);
      const text = screen.getByText('Text');
      expect(text).toHaveClass('bg-muted', 'flex', 'items-center');
    });

    it('renders as div by default', () => {
      render(<ButtonGroupText>Text</ButtonGroupText>);
      const text = screen.getByText('Text');
      expect(text.tagName).toBe('DIV');
    });
  });

  describe('AsChild Prop', () => {
    it('renders as Slot when asChild is true', () => {
      render(
        <ButtonGroupText asChild>
          <span>Custom element</span>
        </ButtonGroupText>
      );
      const element = screen.getByText('Custom element');
      expect(element).toBeInTheDocument();
      expect(element.tagName).toBe('SPAN');
    });

    it('applies styles to child element when asChild is true', () => {
      render(
        <ButtonGroupText asChild className="custom-class">
          <span>Styled</span>
        </ButtonGroupText>
      );
      const element = screen.getByText('Styled');
      expect(element).toHaveClass('custom-class', 'bg-muted');
    });
  });

  describe('HTML Attributes', () => {
    it('accepts and applies className prop', () => {
      render(<ButtonGroupText className="custom-class">Text</ButtonGroupText>);
      const text = screen.getByText('Text');
      expect(text).toHaveClass('custom-class', 'bg-muted');
    });

    it('accepts and applies style prop', () => {
      render(<ButtonGroupText style={{ color: 'blue' }}>Text</ButtonGroupText>);
      const text = screen.getByText('Text');
      expect(text).toHaveStyle({ color: 'blue' });
    });

    it('accepts and applies id prop', () => {
      render(<ButtonGroupText id="text-id">Text</ButtonGroupText>);
      const text = document.querySelector('#text-id');
      expect(text).toBeInTheDocument();
    });

    it('accepts and applies data attributes', () => {
      render(<ButtonGroupText data-testid="custom-text">Text</ButtonGroupText>);
      expect(screen.getByTestId('custom-text')).toBeInTheDocument();
    });
  });
});

describe('ButtonGroupSeparator', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      const { container } = render(<ButtonGroupSeparator />);
      const separator = container.querySelector('[data-slot="button-group-separator"]');
      expect(separator).toBeInTheDocument();
    });

    it('applies vertical orientation by default', () => {
      const { container } = render(<ButtonGroupSeparator />);
      const separator = container.querySelector('[data-slot="button-group-separator"]');
      expect(separator).toHaveAttribute('data-orientation', 'vertical');
    });

    it('applies default styling', () => {
      const { container } = render(<ButtonGroupSeparator />);
      const separator = container.querySelector('[data-slot="button-group-separator"]');
      expect(separator).toHaveClass('bg-input', 'self-stretch');
    });
  });

  describe('Orientation', () => {
    it('applies vertical orientation styles', () => {
      const { container } = render(<ButtonGroupSeparator orientation="vertical" />);
      const separator = container.querySelector('[data-slot="button-group-separator"]');
      expect(separator).toHaveAttribute('data-orientation', 'vertical');
    });

    it('applies horizontal orientation when specified', () => {
      const { container } = render(<ButtonGroupSeparator orientation="horizontal" />);
      const separator = container.querySelector('[data-slot="button-group-separator"]');
      expect(separator).toHaveAttribute('data-orientation', 'horizontal');
    });
  });

  describe('HTML Attributes', () => {
    it('accepts and applies className prop', () => {
      const { container } = render(<ButtonGroupSeparator className="custom-class" />);
      const separator = container.querySelector('[data-slot="button-group-separator"]');
      expect(separator).toHaveClass('custom-class', 'bg-input');
    });

    it('accepts and applies style prop', () => {
      const { container } = render(
        <ButtonGroupSeparator style={{ backgroundColor: 'green' }} />
      );
      const separator = container.querySelector('[data-slot="button-group-separator"]');
      expect(separator).toHaveStyle({ backgroundColor: 'green' });
    });

    it('accepts and applies id prop', () => {
      const { container } = render(<ButtonGroupSeparator id="sep-id" />);
      const separator = container.querySelector('#sep-id');
      expect(separator).toBeInTheDocument();
    });

    it('accepts and applies data attributes', () => {
      render(<ButtonGroupSeparator data-testid="custom-separator" />);
      expect(screen.getByTestId('custom-separator')).toBeInTheDocument();
    });
  });
});

describe('ButtonGroup Integration', () => {
  it('renders complete button group with text and separator', () => {
    const { container } = render(
      <ButtonGroup>
        <ButtonGroupText>Label</ButtonGroupText>
        <ButtonGroupSeparator />
        <button>Action</button>
      </ButtonGroup>
    );

    const group = container.querySelector('[data-slot="button-group"]');
    expect(group).toBeInTheDocument();
    expect(screen.getByText('Label')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    
    const separator = container.querySelector('[data-slot="button-group-separator"]');
    expect(separator).toBeInTheDocument();
  });

  it('renders vertical button group with custom styling', () => {
    const { container } = render(
      <ButtonGroup orientation="vertical" className="group-class">
        <ButtonGroupText className="text-class">Text</ButtonGroupText>
        <ButtonGroupSeparator orientation="horizontal" className="sep-class" />
      </ButtonGroup>
    );

    const group = container.querySelector('[data-slot="button-group"]');
    expect(group).toHaveClass('group-class', 'flex-col');
    
    const text = screen.getByText('Text');
    expect(text).toHaveClass('text-class');
    
    const separator = container.querySelector('[data-slot="button-group-separator"]');
    expect(separator).toHaveClass('sep-class');
  });
});
