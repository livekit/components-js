import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { PopupView } from '@/components/agents-ui/blocks/embed-popup-view-01/components/popup-view';

const startAudioMock = vi.fn((props: any) => (
  <div data-testid="start-audio" data-props={JSON.stringify(props)} />
));

const agentSessionViewMock = vi.fn((props: any) => (
  <div data-testid="agent-session-view" data-props={JSON.stringify(props)} />
));

vi.mock('@livekit/components-react', () => ({
  StartAudio: (props: any) => startAudioMock(props),
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
}));

describe('PopupView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders StartAudio', () => {
    render(<PopupView error={null} />);
    expect(screen.getByTestId('start-audio')).toBeInTheDocument();
  });

  it('forwards supports* props and color to AgentSessionView_01', () => {
    render(
      <PopupView
        error={null}
        color="#ff00ff"
        supportsChatInput={false}
        supportsVideoInput={true}
        supportsScreenShare={false}
      />,
    );
    const props = JSON.parse(screen.getByTestId('agent-session-view').getAttribute('data-props')!);
    expect(props).toMatchObject({
      audioVisualizerColor: '#ff00ff',
      supportsChatInput: false,
      supportsVideoInput: true,
      supportsScreenShare: false,
    });
  });

  it('hides the error overlay when error is null', () => {
    render(<PopupView error={null} />);
    const overlay = screen.getByTestId('error-overlay');
    expect(overlay).toHaveClass('opacity-0', 'pointer-events-none');
  });

  it('shows the error title and description when an error is provided', () => {
    render(<PopupView error={{ title: 'Could not connect', description: 'Network error' }} />);
    const overlay = screen.getByTestId('error-overlay');
    expect(overlay).toHaveClass('opacity-100');
    expect(screen.getByText('Could not connect')).toBeInTheDocument();
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('renders the logo in the error overlay and falls back on load failure', () => {
    render(
      <PopupView
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
