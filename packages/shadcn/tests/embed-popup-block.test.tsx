import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { EmbedPopupView_01 } from '@/components/agents-ui/blocks/embed-popup-view-01/components/embed-popup-block';

const startMock = vi.fn().mockResolvedValue(undefined);
const endMock = vi.fn().mockResolvedValue(undefined);
const mockSession = { isConnected: false, start: startMock, end: endMock } as any;

const useAgentMock = vi.fn(() => ({ isConnected: false }));

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
  useAgent: () => useAgentMock(),
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

describe('EmbedPopupView_01', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession.isConnected = false;
    useAgentMock.mockReturnValue({ isConnected: false });
  });

  it('renders the trigger but not the popup view when closed', () => {
    render(<EmbedPopupView_01 tokenSource={tokenSource} />);
    expect(screen.getByTestId('trigger')).toBeInTheDocument();
    expect(screen.queryByTestId('popup-view')).not.toBeInTheDocument();
  });

  it('starts the session and renders PopupView when the trigger is toggled open', async () => {
    render(<EmbedPopupView_01 tokenSource={tokenSource} />);
    await act(async () => {
      screen.getByTestId('trigger').click();
    });
    expect(startMock).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('popup-view')).toBeInTheDocument();
  });

  it('ends the session when toggled closed again', async () => {
    render(<EmbedPopupView_01 tokenSource={tokenSource} />);
    await act(async () => {
      screen.getByTestId('trigger').click();
    });
    await act(async () => {
      screen.getByTestId('trigger').click();
    });
    expect(endMock).toHaveBeenCalled();
    expect(screen.queryByTestId('popup-view')).not.toBeInTheDocument();
  });

  it('forwards triggerColor as color, logo, and agentName to Trigger', () => {
    render(
      <EmbedPopupView_01
        tokenSource={tokenSource}
        triggerColor="#ff00ff"
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

  it('applies the default agentName when not provided', () => {
    render(<EmbedPopupView_01 tokenSource={tokenSource} />);
    const call = triggerMock.mock.calls[0][0];
    expect(call).toEqual(expect.objectContaining({ agentName: 'Agent' }));
    expect(call.color).toBeUndefined();
  });

  it('forwards merged controls to PopupView when open', async () => {
    render(
      <EmbedPopupView_01
        tokenSource={tokenSource}
        controls={{ chat: false, camera: false, screenShare: false }}
      />,
    );
    await act(async () => {
      screen.getByTestId('trigger').click();
    });
    const props = JSON.parse(screen.getByTestId('popup-view').getAttribute('data-props')!);
    expect(props.controls).toEqual({
      leave: false,
      microphone: true,
      chat: false,
      camera: false,
      screenShare: false,
    });
  });
});
