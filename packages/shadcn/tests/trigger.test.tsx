import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Trigger } from '@/components/agents-ui/blocks/embed-popup-view-01/components/trigger';

describe('Trigger', () => {
  it('calls onToggle when clicked', () => {
    const onToggle = vi.fn();
    render(<Trigger color="#3b82f6" isPressed={false} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('reflects isPressed via aria-expanded and aria-label', () => {
    const { rerender } = render(
      <Trigger color="#3b82f6" isPressed={false} onToggle={vi.fn()} agentName="Rex" />,
    );
    let button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAttribute('aria-label', 'Rex agent');

    rerender(<Trigger color="#3b82f6" isPressed={true} onToggle={vi.fn()} agentName="Rex" />);
    button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(button).toHaveAttribute('aria-label', 'Close assistant');
  });

  it('falls back to a generic aria-label when agentName is not provided', () => {
    render(<Trigger color="#3b82f6" isPressed={false} onToggle={vi.fn()} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Open assistant');
  });

  it('renders the provided logo image', () => {
    render(
      <Trigger
        color="#3b82f6"
        logo="https://example.com/logo.png"
        isPressed={false}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/logo.png');
  });

  it('falls back to the default icon when the logo image fails to load', () => {
    render(
      <Trigger
        color="#3b82f6"
        logo="https://example.com/broken.png"
        isPressed={false}
        onToggle={vi.fn()}
      />,
    );
    fireEvent.error(screen.getByRole('img'));
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('shows the connecting spinner when pressed, not connected, and there is no error', () => {
    render(<Trigger color="#3b82f6" isPressed={true} isConnected={false} onToggle={vi.fn()} />);
    const ring = screen.getByRole('button').querySelector('.animate-spin');
    expect(ring).not.toBeNull();
  });

  it('does not show the connecting spinner when connected', () => {
    render(<Trigger color="#3b82f6" isPressed={true} isConnected={true} onToggle={vi.fn()} />);
    const ring = screen.getByRole('button').querySelector('.animate-spin');
    expect(ring).toBeNull();
  });

  it('does not show the connecting spinner when there is an error', () => {
    render(
      <Trigger
        color="#3b82f6"
        isPressed={true}
        isConnected={false}
        error={{ title: 'Oops', description: 'Failed' }}
        onToggle={vi.fn()}
      />,
    );
    const ring = screen.getByRole('button').querySelector('.animate-spin');
    expect(ring).toBeNull();
  });
});
