import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AgentStatusChange, AgentStatusLine } from '@/components/agents-ui/agent-status-line';

describe('AgentStatusLine', () => {
  it('shows the status, what it is about, and the meta line', () => {
    render(
      <AgentStatusLine mark="check" status="Verified" meta="Just now" data-testid="line">
        Priya Shah · BlueShield HMO
      </AgentStatusLine>,
    );
    expect(screen.getByTestId('line')).toHaveTextContent(
      'VerifiedPriya Shah · BlueShield HMOJust now',
    );
  });

  it('announces the mark when there is no status', () => {
    render(
      <AgentStatusLine mark="cross" data-testid="line">
        Dr. Patel is out of network
      </AgentStatusLine>,
    );
    expect(screen.getByTestId('line')).toHaveTextContent('Cancelled: Dr. Patel is out of network');
  });

  it('rewords the mark with labels', () => {
    render(
      <AgentStatusLine mark="arrow" labels={{ arrow: 'Transferred' }} data-testid="line">
        To billing
      </AgentStatusLine>,
    );
    expect(screen.getByTestId('line')).toHaveTextContent('Transferred: To billing');
  });

  it('uses a custom icon in place of the mark', () => {
    render(
      <AgentStatusLine
        mark="check"
        status="Ready"
        icon={<svg data-testid="bag" aria-hidden="true" />}
        data-testid="line"
      />,
    );
    expect(screen.getByTestId('line')).toContainElement(screen.getByTestId('bag'));
  });

  it('exposes its mark for styling', () => {
    render(<AgentStatusLine mark="alert" status="Allergen found" data-testid="line" />);
    expect(screen.getByTestId('line')).toHaveAttribute('data-mark', 'alert');
  });
});

describe('AgentStatusChange', () => {
  it('reads as a change from one value to another', () => {
    render(<AgentStatusChange from="2:00 PM" to="3:30 PM" data-testid="change" />);
    const change = screen.getByTestId('change');
    expect(change).toHaveTextContent('from 2:00 PM → to 3:30 PM');
    expect(change.querySelector('s')).toHaveTextContent('2:00 PM');
  });

  it('rewords the connecting words with labels', () => {
    render(
      <AgentStatusChange
        from="14:00"
        to="15:30"
        labels={{ from: 'de', to: 'a' }}
        data-testid="change"
      />,
    );
    expect(screen.getByTestId('change')).toHaveTextContent('de 14:00 → a 15:30');
  });
});
