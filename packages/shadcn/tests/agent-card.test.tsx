import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  AgentCard,
  AgentCardDetail,
  AgentCardRow,
  AgentCardRows,
  AgentCardTotal,
} from '@/components/agents-ui/agent-card';

describe('AgentCard', () => {
  it('is a group named by its label', () => {
    render(<AgentCard label="Your order">Contents</AgentCard>);
    expect(screen.getByRole('group', { name: 'Your order' })).toHaveTextContent('Contents');
  });

  it('is a plain container without a label', () => {
    render(<AgentCard data-testid="card">Contents</AgentCard>);
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });

  it('applies html attributes (id, class, style, aria)', () => {
    render(
      <AgentCard
        id="order"
        className="custom-class"
        style={{ opacity: 0.8 }}
        aria-label="Order card"
      />,
    );
    const card = screen.getByLabelText('Order card');
    expect(card).toHaveAttribute('id', 'order');
    expect(card).toHaveClass('custom-class');
    expect(card).toHaveStyle({ opacity: '0.8' });
  });

  it('shows a detail with its icon', () => {
    render(
      <AgentCardDetail icon={<svg data-testid="icon" aria-hidden="true" />}>
        Delivering to 300 De Haro St
      </AgentCardDetail>,
    );
    expect(screen.getByText('Delivering to 300 De Haro St')).toContainElement(
      screen.getByTestId('icon'),
    );
  });
});

describe('AgentCardRows', () => {
  it('pairs each label with its value', () => {
    render(
      <AgentCardRows>
        <AgentCardRow count={2} label="Margherita" value="$24.00" />
        <AgentCardTotal label="Total" value="$24.00" />
      </AgentCardRows>,
    );
    const terms = screen.getAllByRole('term');
    const definitions = screen.getAllByRole('definition');
    expect(terms.map((term) => term.textContent)).toEqual(['2×Margherita', 'Total']);
    expect(definitions.map((definition) => definition.textContent)).toEqual(['$24.00', '$24.00']);
  });

  it('announces marks', () => {
    render(
      <AgentCardRows>
        <AgentCardRow mark="check" label="Name" value="Priya Shah" />
        <AgentCardRow mark="pending" label="Insurance" />
      </AgentCardRows>,
    );
    const [name, insurance] = screen.getAllByRole('term');
    expect(name).toHaveTextContent('Done: Name');
    expect(insurance).toHaveTextContent('Pending: Insurance');
  });

  it('rewords marks with labels', () => {
    render(
      <AgentCardRows labels={{ done: 'Listo' }}>
        <AgentCardRow mark="check" label="Nombre" />
        <AgentCardRow mark="pending" label="Seguro" />
      </AgentCardRows>,
    );
    const [name, insurance] = screen.getAllByRole('term');
    expect(name).toHaveTextContent('Listo: Nombre');
    expect(insurance).toHaveTextContent('Pending: Seguro');
  });

  it('marks the current row', () => {
    render(
      <AgentCardRows>
        <AgentCardRow label="Name" data-testid="name" />
        <AgentCardRow label="Date of birth" current data-testid="birth" />
      </AgentCardRows>,
    );
    expect(screen.getByTestId('name')).not.toHaveAttribute('aria-current');
    expect(screen.getByTestId('birth')).toHaveAttribute('aria-current', 'true');
  });

  it('shows a badge after the label', () => {
    render(
      <AgentCardRows>
        <AgentCardRow label="Brakes" badge={<span>Urgent</span>} value="$180" />
      </AgentCardRows>,
    );
    expect(screen.getByRole('term')).toHaveTextContent('BrakesUrgent');
  });
});
