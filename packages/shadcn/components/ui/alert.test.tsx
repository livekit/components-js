import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Alert, AlertTitle, AlertDescription } from './alert';

describe('Alert', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      const { container } = render(<Alert>Test alert</Alert>);
      const alert = container.querySelector('[data-slot="alert"]');
      expect(alert).toBeInTheDocument();
    });

    it('has role alert', () => {
      render(<Alert>Alert content</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('renders children content', () => {
      render(<Alert>Test content</Alert>);
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('applies default variant styles', () => {
      const { container } = render(<Alert variant="default">Default</Alert>);
      const alert = container.querySelector('[data-slot="alert"]');
      expect(alert).toHaveClass('bg-card', 'text-card-foreground');
    });

    it('applies destructive variant styles', () => {
      const { container } = render(<Alert variant="destructive">Destructive</Alert>);
      const alert = container.querySelector('[data-slot="alert"]');
      expect(alert).toHaveClass('text-destructive', 'bg-card');
    });

    it('uses default variant when none specified', () => {
      const { container } = render(<Alert>No variant</Alert>);
      const alert = container.querySelector('[data-slot="alert"]');
      expect(alert).toHaveClass('bg-card', 'text-card-foreground');
    });
  });

  describe('HTML Attributes', () => {
    it('accepts and applies className prop', () => {
      const { container } = render(<Alert className="custom-class">Alert</Alert>);
      const alert = container.querySelector('[data-slot="alert"]');
      expect(alert).toHaveClass('custom-class');
    });

    it('accepts and applies style prop', () => {
      const { container } = render(
        <Alert style={{ backgroundColor: 'blue' }}>Alert</Alert>
      );
      const alert = container.querySelector('[data-slot="alert"]');
      expect(alert).toHaveStyle({ backgroundColor: 'blue' });
    });

    it('accepts and applies id prop', () => {
      const { container } = render(<Alert id="test-alert">Alert</Alert>);
      const alert = container.querySelector('#test-alert');
      expect(alert).toBeInTheDocument();
    });

    it('accepts and applies data attributes', () => {
      render(<Alert data-testid="custom-alert">Alert</Alert>);
      expect(screen.getByTestId('custom-alert')).toBeInTheDocument();
    });

    it('accepts and applies aria attributes', () => {
      const { container } = render(
        <Alert aria-labelledby="alert-title">Alert</Alert>
      );
      const alert = container.querySelector('[aria-labelledby="alert-title"]');
      expect(alert).toBeInTheDocument();
    });
  });

  describe('Combined Props', () => {
    it('merges custom className with variant classes', () => {
      const { container } = render(
        <Alert variant="destructive" className="my-custom-class">
          Alert
        </Alert>
      );
      const alert = container.querySelector('[data-slot="alert"]');
      expect(alert).toHaveClass('text-destructive', 'my-custom-class');
    });
  });
});

describe('AlertTitle', () => {
  describe('Rendering', () => {
    it('renders with children', () => {
      const { container } = render(
        <Alert>
          <AlertTitle>Title</AlertTitle>
        </Alert>
      );
      const title = container.querySelector('[data-slot="alert-title"]');
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent('Title');
    });

    it('applies default styling', () => {
      const { container } = render(
        <Alert>
          <AlertTitle>Title</AlertTitle>
        </Alert>
      );
      const title = container.querySelector('[data-slot="alert-title"]');
      expect(title).toHaveClass('font-medium', 'tracking-tight');
    });
  });

  describe('HTML Attributes', () => {
    it('accepts and applies className prop', () => {
      const { container } = render(
        <Alert>
          <AlertTitle className="custom-title">Title</AlertTitle>
        </Alert>
      );
      const title = container.querySelector('[data-slot="alert-title"]');
      expect(title).toHaveClass('custom-title', 'font-medium');
    });

    it('accepts and applies style prop', () => {
      const { container } = render(
        <Alert>
          <AlertTitle style={{ color: 'red' }}>Title</AlertTitle>
        </Alert>
      );
      const title = container.querySelector('[data-slot="alert-title"]');
      expect(title).toHaveStyle({ color: 'red' });
    });

    it('accepts and applies id prop', () => {
      const { container } = render(
        <Alert>
          <AlertTitle id="alert-title">Title</AlertTitle>
        </Alert>
      );
      const title = container.querySelector('#alert-title');
      expect(title).toBeInTheDocument();
    });

    it('accepts and applies data attributes', () => {
      render(
        <Alert>
          <AlertTitle data-testid="custom-title">Title</AlertTitle>
        </Alert>
      );
      expect(screen.getByTestId('custom-title')).toBeInTheDocument();
    });
  });
});

describe('AlertDescription', () => {
  describe('Rendering', () => {
    it('renders with children', () => {
      const { container } = render(
        <Alert>
          <AlertDescription>Description</AlertDescription>
        </Alert>
      );
      const description = container.querySelector('[data-slot="alert-description"]');
      expect(description).toBeInTheDocument();
      expect(description).toHaveTextContent('Description');
    });

    it('applies default styling', () => {
      const { container } = render(
        <Alert>
          <AlertDescription>Description</AlertDescription>
        </Alert>
      );
      const description = container.querySelector('[data-slot="alert-description"]');
      expect(description).toHaveClass('text-muted-foreground', 'text-sm');
    });
  });

  describe('HTML Attributes', () => {
    it('accepts and applies className prop', () => {
      const { container } = render(
        <Alert>
          <AlertDescription className="custom-desc">Description</AlertDescription>
        </Alert>
      );
      const description = container.querySelector('[data-slot="alert-description"]');
      expect(description).toHaveClass('custom-desc', 'text-muted-foreground');
    });

    it('accepts and applies style prop', () => {
      const { container } = render(
        <Alert>
          <AlertDescription style={{ fontSize: '14px' }}>Description</AlertDescription>
        </Alert>
      );
      const description = container.querySelector('[data-slot="alert-description"]');
      expect(description).toHaveStyle({ fontSize: '14px' });
    });

    it('accepts and applies id prop', () => {
      const { container } = render(
        <Alert>
          <AlertDescription id="alert-desc">Description</AlertDescription>
        </Alert>
      );
      const description = container.querySelector('#alert-desc');
      expect(description).toBeInTheDocument();
    });

    it('accepts and applies data attributes', () => {
      render(
        <Alert>
          <AlertDescription data-testid="custom-desc">Description</AlertDescription>
        </Alert>
      );
      expect(screen.getByTestId('custom-desc')).toBeInTheDocument();
    });
  });
});

describe('Alert Integration', () => {
  it('renders complete alert with title and description', () => {
    const { container } = render(
      <Alert>
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Something went wrong</AlertDescription>
      </Alert>
    );

    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    
    const alert = container.querySelector('[data-slot="alert"]');
    expect(alert).toHaveAttribute('role', 'alert');
  });

  it('renders destructive alert with icon and content', () => {
    const { container } = render(
      <Alert variant="destructive">
        <svg>Icon</svg>
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Critical error occurred</AlertDescription>
      </Alert>
    );

    const alert = container.querySelector('[data-slot="alert"]');
    expect(alert).toHaveClass('text-destructive');
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Critical error occurred')).toBeInTheDocument();
  });

  it('renders alert with custom styling on all components', () => {
    const { container } = render(
      <Alert className="alert-class">
        <AlertTitle className="title-class">Title</AlertTitle>
        <AlertDescription className="desc-class">Description</AlertDescription>
      </Alert>
    );

    const alert = container.querySelector('[data-slot="alert"]');
    const title = container.querySelector('[data-slot="alert-title"]');
    const description = container.querySelector('[data-slot="alert-description"]');

    expect(alert).toHaveClass('alert-class');
    expect(title).toHaveClass('title-class');
    expect(description).toHaveClass('desc-class');
  });
});
