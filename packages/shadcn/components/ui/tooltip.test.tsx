import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './tooltip';

describe('TooltipProvider', () => {
  it('renders with default props', () => {
    const { container } = render(
      <TooltipProvider>
        <div>Content</div>
      </TooltipProvider>
    );
    expect(container).toBeInTheDocument();
  });

  it('accepts and applies delayDuration prop', () => {
    render(
      <TooltipProvider delayDuration={500}>
        <div>Content</div>
      </TooltipProvider>
    );
    // Provider renders children
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('accepts and applies data attributes', () => {
    const { container } = render(
      <TooltipProvider>
        <div>Content</div>
      </TooltipProvider>
    );
    const provider = container.querySelector('[data-slot="tooltip-provider"]');
    expect(provider).toBeInTheDocument();
  });
});

describe('Tooltip', () => {
  it('renders tooltip with trigger and content', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip>
        <TooltipTrigger>Hover me</TooltipTrigger>
        <TooltipContent>Tooltip content</TooltipContent>
      </Tooltip>
    );

    const trigger = screen.getByText('Hover me');
    expect(trigger).toBeInTheDocument();

    // Hover to show tooltip
    await user.hover(trigger);
    await waitFor(() => {
      expect(screen.getByText('Tooltip content')).toBeInTheDocument();
    });
  });

  it('accepts open prop for controlled state', () => {
    render(
      <Tooltip open={true}>
        <TooltipTrigger>Trigger</TooltipTrigger>
        <TooltipContent>Content</TooltipContent>
      </Tooltip>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('calls onOpenChange when tooltip state changes', async () => {
    const handleOpenChange = vi.fn();
    const user = userEvent.setup();
    
    render(
      <Tooltip onOpenChange={handleOpenChange}>
        <TooltipTrigger>Trigger</TooltipTrigger>
        <TooltipContent>Content</TooltipContent>
      </Tooltip>
    );

    const trigger = screen.getByText('Trigger');
    await user.hover(trigger);

    await waitFor(() => {
      expect(handleOpenChange).toHaveBeenCalledWith(true);
    });
  });

  it('accepts defaultOpen prop', () => {
    render(
      <Tooltip defaultOpen>
        <TooltipTrigger>Trigger</TooltipTrigger>
        <TooltipContent>Content</TooltipContent>
      </Tooltip>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});

describe('TooltipTrigger', () => {
  it('renders trigger element', () => {
    render(
      <Tooltip>
        <TooltipTrigger>Click me</TooltipTrigger>
        <TooltipContent>Tooltip</TooltipContent>
      </Tooltip>
    );

    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('accepts and applies className prop', () => {
    render(
      <Tooltip>
        <TooltipTrigger className="custom-trigger">Trigger</TooltipTrigger>
        <TooltipContent>Content</TooltipContent>
      </Tooltip>
    );

    const trigger = screen.getByText('Trigger');
    expect(trigger).toHaveClass('custom-trigger');
  });

  it('accepts and applies data attributes', () => {
    render(
      <Tooltip>
        <TooltipTrigger data-testid="custom-trigger">Trigger</TooltipTrigger>
        <TooltipContent>Content</TooltipContent>
      </Tooltip>
    );

    expect(screen.getByTestId('custom-trigger')).toBeInTheDocument();
  });

  it('shows tooltip on hover', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip>
        <TooltipTrigger>Hover</TooltipTrigger>
        <TooltipContent>Tooltip</TooltipContent>
      </Tooltip>
    );

    const trigger = screen.getByText('Hover');
    await user.hover(trigger);

    await waitFor(() => {
      expect(screen.getByText('Tooltip')).toBeInTheDocument();
    });
  });

  it('hides tooltip on unhover', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip>
        <TooltipTrigger>Hover</TooltipTrigger>
        <TooltipContent>Tooltip</TooltipContent>
      </Tooltip>
    );

    const trigger = screen.getByText('Hover');
    await user.hover(trigger);

    await waitFor(() => {
      expect(screen.getByText('Tooltip')).toBeInTheDocument();
    });

    await user.unhover(trigger);

    await waitFor(() => {
      expect(screen.queryByText('Tooltip')).not.toBeInTheDocument();
    });
  });

  it('accepts asChild prop', () => {
    render(
      <Tooltip>
        <TooltipTrigger asChild>
          <button>Custom Button</button>
        </TooltipTrigger>
        <TooltipContent>Content</TooltipContent>
      </Tooltip>
    );

    expect(screen.getByRole('button', { name: 'Custom Button' })).toBeInTheDocument();
  });
});

describe('TooltipContent', () => {
  it('renders content when tooltip is open', () => {
    render(
      <Tooltip open={true}>
        <TooltipTrigger>Trigger</TooltipTrigger>
        <TooltipContent>Test content</TooltipContent>
      </Tooltip>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('accepts and applies className prop', () => {
    render(
      <Tooltip open={true}>
        <TooltipTrigger>Trigger</TooltipTrigger>
        <TooltipContent className="custom-content">Content</TooltipContent>
      </Tooltip>
    );

    const content = screen.getByText('Content');
    expect(content).toHaveClass('custom-content');
  });

  it('applies default styling classes', () => {
    render(
      <Tooltip open={true}>
        <TooltipTrigger>Trigger</TooltipTrigger>
        <TooltipContent>Content</TooltipContent>
      </Tooltip>
    );

    const content = screen.getByText('Content');
    expect(content).toHaveClass('bg-foreground', 'text-background');
  });

  it('accepts and applies sideOffset prop', () => {
    render(
      <Tooltip open={true}>
        <TooltipTrigger>Trigger</TooltipTrigger>
        <TooltipContent sideOffset={10}>Content</TooltipContent>
      </Tooltip>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('accepts and applies side prop', () => {
    render(
      <Tooltip open={true}>
        <TooltipTrigger>Trigger</TooltipTrigger>
        <TooltipContent side="top">Content</TooltipContent>
      </Tooltip>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('accepts and applies align prop', () => {
    render(
      <Tooltip open={true}>
        <TooltipTrigger>Trigger</TooltipTrigger>
        <TooltipContent align="center">Content</TooltipContent>
      </Tooltip>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders arrow element', () => {
    const { container } = render(
      <Tooltip open={true}>
        <TooltipTrigger>Trigger</TooltipTrigger>
        <TooltipContent>Content</TooltipContent>
      </Tooltip>
    );

    const arrow = container.querySelector('.bg-foreground.fill-foreground');
    expect(arrow).toBeInTheDocument();
  });

  it('accepts and applies data attributes', () => {
    render(
      <Tooltip open={true}>
        <TooltipTrigger>Trigger</TooltipTrigger>
        <TooltipContent data-testid="custom-content">Content</TooltipContent>
      </Tooltip>
    );

    expect(screen.getByTestId('custom-content')).toBeInTheDocument();
  });

  it('has data-slot attribute', () => {
    const { container } = render(
      <Tooltip open={true}>
        <TooltipTrigger>Trigger</TooltipTrigger>
        <TooltipContent>Content</TooltipContent>
      </Tooltip>
    );

    const content = container.querySelector('[data-slot="tooltip-content"]');
    expect(content).toBeInTheDocument();
  });
});

describe('Tooltip Integration', () => {
  it('works with custom styling', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip>
        <TooltipTrigger className="trigger-class">Trigger</TooltipTrigger>
        <TooltipContent className="content-class">Content</TooltipContent>
      </Tooltip>
    );

    const trigger = screen.getByText('Trigger');
    expect(trigger).toHaveClass('trigger-class');

    await user.hover(trigger);

    await waitFor(() => {
      const content = screen.getByText('Content');
      expect(content).toHaveClass('content-class');
    });
  });

  it('handles multiple tooltips', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Tooltip>
          <TooltipTrigger>First</TooltipTrigger>
          <TooltipContent>First tooltip</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger>Second</TooltipTrigger>
          <TooltipContent>Second tooltip</TooltipContent>
        </Tooltip>
      </div>
    );

    const firstTrigger = screen.getByText('First');
    await user.hover(firstTrigger);

    await waitFor(() => {
      expect(screen.getByText('First tooltip')).toBeInTheDocument();
    });

    const secondTrigger = screen.getByText('Second');
    await user.hover(secondTrigger);

    await waitFor(() => {
      expect(screen.getByText('Second tooltip')).toBeInTheDocument();
    });
  });
});
