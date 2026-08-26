import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { PopupView } from '@/components/agents-ui/blocks/embed-popup-view-01/components/popup-view';

const startAudioButtonMock = vi.fn((props: any) => (
  <div data-testid="start-audio-button" data-props={JSON.stringify(props)} />
));

const agentSessionViewMock = vi.fn((props: any) => (
  <div data-testid="agent-session-view" data-props={JSON.stringify(props)} />
));

vi.mock('@/components/agents-ui/start-audio-button', () => ({
  StartAudioButton: (props: any) => startAudioButtonMock(props),
}));

vi.mock(
  '@/components/agents-ui/blocks/agent-session-view-01/components/agent-session-block',
  () => ({
    AgentSessionView_01: (props: any) => agentSessionViewMock(props),
  }),
);

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const CONTROLS = {
  leave: true,
  microphone: true,
  chat: true,
  camera: true,
  screenShare: true,
};

describe('PopupView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the StartAudioButton', () => {
    render(<PopupView controls={CONTROLS} />);
    expect(screen.getByTestId('start-audio-button')).toBeInTheDocument();
  });

  it('forwards the audioVisualizer config and controls to AgentSessionView_01', () => {
    render(<PopupView controls={CONTROLS} audioVisualizer={{ color: '#ff00ff', type: 'wave' }} />);
    const props = JSON.parse(screen.getByTestId('agent-session-view').getAttribute('data-props')!);
    expect(props).toMatchObject({
      audioVisualizer: { color: '#ff00ff', type: 'wave' },
      controls: CONTROLS,
    });
  });

  it('does not render the error overlay when there is no error', () => {
    render(<PopupView controls={CONTROLS} />);
    expect(screen.queryByTestId('error-overlay')).not.toBeInTheDocument();
  });

  it('shows the error title and description when an error is provided', () => {
    render(
      <PopupView
        controls={CONTROLS}
        error={{ title: 'Could not connect', description: 'Network error' }}
      />,
    );
    expect(screen.getByTestId('error-overlay')).toBeInTheDocument();
    expect(screen.getByText('Could not connect')).toBeInTheDocument();
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('renders the logo in the error overlay and falls back on load failure', () => {
    render(
      <PopupView
        controls={CONTROLS}
        error={{ title: 'Could not connect', description: 'Network error' }}
        logo="https://example.com/logo.png"
        agentName="Rex"
      />,
    );
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('alt', 'Rex logo');
    fireEvent.error(img);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
