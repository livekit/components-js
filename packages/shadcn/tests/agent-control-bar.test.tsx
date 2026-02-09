import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgentControlBar } from '@/components/agents-ui/agent-control-bar';
import * as controlBarHooks from '@/hooks/agents-ui/use-agent-control-bar';

const sendMock = vi.fn();

vi.mock('@livekit/components-react', () => ({
  useChat: () => ({ send: sendMock }),
}));

vi.mock('@/hooks/agents-ui/use-agent-control-bar', () => ({
  useInputControls: vi.fn(() => ({
    microphoneTrack: undefined,
    cameraToggle: { enabled: false, pending: false, toggle: vi.fn() },
    microphoneToggle: { enabled: false, pending: false, toggle: vi.fn() },
    screenShareToggle: { enabled: false, pending: false, toggle: vi.fn() },
    handleAudioDeviceChange: vi.fn(),
    handleVideoDeviceChange: vi.fn(),
    handleMicrophoneDeviceSelectError: vi.fn(),
    handleCameraDeviceSelectError: vi.fn(),
  })),
  usePublishPermissions: vi.fn(() => ({
    camera: true,
    microphone: true,
    screenShare: true,
    data: true,
  })),
}));

vi.mock('@/components/agents-ui/agent-track-control', () => ({
  AgentTrackControl: ({ kind, ...props }: any) => (
    <div data-testid="track-control" data-kind={kind} {...props} />
  ),
}));

vi.mock('@/components/agents-ui/agent-track-toggle', () => ({
  AgentTrackToggle: ({ source, ...props }: any) => (
    <button data-testid="track-toggle" data-source={source} {...props} />
  ),
  agentTrackToggleVariants: (args: any) => args?.className ?? '',
}));

vi.mock('@/components/agents-ui/agent-disconnect-button', () => ({
  AgentDisconnectButton: ({ disabled, children, ...props }: any) => (
    <button
      type="button"
      data-testid="disconnect-button"
      data-disabled={disabled ? 'true' : 'false'}
      {...props}
    >
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/toggle', () => ({
  Toggle: ({ pressed, onPressedChange, ...props }: any) => (
    <button
      type="button"
      data-testid="toggle"
      data-pressed={pressed ? 'true' : 'false'}
      onClick={() => onPressedChange?.(!pressed)}
      {...props}
    />
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
}));

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('AgentControlBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders expected controls by default', () => {
    render(<AgentControlBar isConnected />);
    expect(screen.getAllByTestId('track-control')).toHaveLength(2);
    expect(screen.getByTestId('track-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('toggle')).toBeInTheDocument();
    expect(screen.getByTestId('disconnect-button')).toBeInTheDocument();
  });

  it('applies html attributes (id, class, style, aria)', () => {
    render(
      <AgentControlBar
        isConnected
        id="agent-controls"
        className="custom-class"
        style={{ opacity: 0.8 }}
        aria-label="Custom controls label"
      />,
    );
    const controls = screen.getByLabelText('Custom controls label');
    expect(controls).toHaveAttribute('id', 'agent-controls');
    expect(controls).toHaveClass('custom-class');
    expect(controls).toHaveStyle({ opacity: '0.8' });
  });

  it('applies click handler', () => {
    const onClick = vi.fn();
    render(
      <AgentControlBar
        isConnected
        data-testid="agent-controls"
        onClick={onClick}
      />,
    );
    const controls = screen.getByTestId('agent-controls');
    fireEvent.click(controls);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('disables disconnect when not connected', () => {
    render(<AgentControlBar isConnected={false} />);
    expect(screen.getByTestId('disconnect-button')).toHaveAttribute('data-disabled', 'true');
  });

  it('renders null and warns when all controls are false', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.mocked(controlBarHooks.usePublishPermissions).mockReturnValue({
      camera: false,
      microphone: false,
      screenShare: false,
      data: false,
    });

    const { container } = render(
      <AgentControlBar
        controls={{
          leave: false,
          microphone: false,
          screenShare: false,
          camera: false,
          chat: false,
        }}
      />,
    );

    expect(container.firstChild).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      'AgentControlBar: `visibleControls` contains only false values.',
    );
    warnSpy.mockRestore();
  });

  it('sends chat messages when chat is open', async () => {
    const user = userEvent.setup();
    render(<AgentControlBar isChatOpen />);

    const input = screen.getByPlaceholderText('Type something...');
    await user.type(input, 'Hello world');
    await user.click(screen.getByTitle('Send'));

    await waitFor(() => {
      expect(sendMock).toHaveBeenCalledWith('Hello world');
    });
  });
});
