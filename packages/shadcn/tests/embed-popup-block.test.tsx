import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { AgentClient } from '@/components/agents-ui/blocks/embed-popup-view-01/components/embed-popup-block';

const startMock = vi.fn().mockResolvedValue(undefined);
const endMock = vi.fn().mockResolvedValue(undefined);
const mockSession = { isConnected: false, start: startMock, end: endMock } as any;

const triggerMock = vi.fn((props: any) => (
  <button data-testid="trigger" onClick={props.onToggle}>
    trigger
  </button>
));

const popupViewMock = vi.fn((props: any) => (
  <div data-testid="popup-view" data-props={JSON.stringify(props)} />
));

vi.mock('@livekit/components-react', () => ({
  useSession: () => mockSession,
}));

vi.mock('@/components/agents-ui/agent-session-provider', () => ({
  AgentSessionProvider: ({ children }: any) => <div data-testid="session-provider">{children}</div>,
}));

vi.mock('@/components/agents-ui/blocks/embed-popup-view-01/components/trigger', () => ({
  Trigger: (props: any) => triggerMock(props),
}));

vi.mock('@/components/agents-ui/blocks/embed-popup-view-01/components/popup-view', () => ({
  PopupView: (props: any) => popupViewMock(props),
}));

const tokenSource = {} as any;

describe('AgentClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession.isConnected = false;
  });

  it('renders the trigger but not the popup view when closed', () => {
    render(<AgentClient tokenSource={tokenSource} />);
    expect(screen.getByTestId('trigger')).toBeInTheDocument();
    expect(screen.queryByTestId('popup-view')).not.toBeInTheDocument();
  });

  it('starts the session and renders PopupView when the trigger is toggled open', async () => {
    render(<AgentClient tokenSource={tokenSource} />);
    await act(async () => {
      screen.getByTestId('trigger').click();
    });
    expect(startMock).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('popup-view')).toBeInTheDocument();
  });

  it('ends the session when toggled closed again', async () => {
    render(<AgentClient tokenSource={tokenSource} />);
    await act(async () => {
      screen.getByTestId('trigger').click();
    });
    await act(async () => {
      screen.getByTestId('trigger').click();
    });
    expect(endMock).toHaveBeenCalled();
    expect(screen.queryByTestId('popup-view')).not.toBeInTheDocument();
  });

  it('forwards color, logo, and agentName to Trigger', () => {
    render(
      <AgentClient
        tokenSource={tokenSource}
        color="#ff00ff"
        logo="https://example.com/logo.png"
        agentName="Assistant"
      />,
    );
    const call = triggerMock.mock.calls[0][0];
    expect(call).toEqual(
      expect.objectContaining({
        color: '#ff00ff',
        logo: 'https://example.com/logo.png',
        agentName: 'Assistant',
      }),
    );
  });

  it('applies default color and agentName when not provided', () => {
    render(<AgentClient tokenSource={tokenSource} />);
    const call = triggerMock.mock.calls[0][0];
    expect(call).toEqual(expect.objectContaining({ color: '#3b82f6', agentName: 'Agent' }));
  });

  it('forwards supports* props to PopupView when open', async () => {
    render(
      <AgentClient
        tokenSource={tokenSource}
        supportsChatInput={false}
        supportsVideoInput={false}
        supportsScreenShare={false}
      />,
    );
    await act(async () => {
      screen.getByTestId('trigger').click();
    });
    const props = JSON.parse(screen.getByTestId('popup-view').getAttribute('data-props')!);
    expect(props).toMatchObject({
      supportsChatInput: false,
      supportsVideoInput: false,
      supportsScreenShare: false,
    });
  });
});
