import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgentTrackControl } from '@/components/agents-ui/agent-track-control';
import * as LiveKitComponents from '@livekit/components-react';

const setActiveMediaDeviceMock = vi.fn();

vi.mock('@livekit/components-react', async () => {
  const actual = await vi.importActual('@livekit/components-react');
  return {
    ...actual,
    useMaybeRoomContext: vi.fn(() => ({ id: 'room' })),
    useMediaDeviceSelect: vi.fn(() => ({
      devices: [],
      activeDeviceId: 'device-1',
      setActiveMediaDevice: setActiveMediaDeviceMock,
    })),
  };
});

vi.mock('@/components/agents-ui/agent-track-toggle', () => ({
  AgentTrackToggle: ({ source, pressed, pending, disabled, children, onPressedChange }: any) => (
    <button
      type="button"
      data-testid="track-toggle"
      data-source={source}
      data-pending={pending ? 'true' : 'false'}
      aria-pressed={pressed ? 'true' : 'false'}
      disabled={disabled}
      onClick={() => onPressedChange?.(!pressed)}
    >
      {children}
    </button>
  ),
}));

vi.mock('@/components/agents-ui/agent-audio-visualizer-bar', () => ({
  AgentAudioVisualizerBar: ({ state, audioTrack, children }: any) => (
    <div
      data-testid="audio-visualizer"
      data-state={state}
      data-has-track={audioTrack ? 'true' : 'false'}
    >
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, onOpenChange, onValueChange, value }: any) => (
    <div data-testid="device-select" data-value={value}>
      <button type="button" data-testid="open-select" onClick={() => onOpenChange?.(true)}>
        Open
      </button>
      <button type="button" data-testid="choose-device" onClick={() => onValueChange?.('device-2')}>
        Choose
      </button>
      {children}
    </div>
  ),
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }: any) => (
    <div data-testid="select-item" data-value={value}>
      {children}
    </div>
  ),
  SelectTrigger: ({ children, className }: any) => (
    <button type="button" data-testid="select-trigger" className={className}>
      {children}
    </button>
  ),
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}));

describe('AgentTrackControl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(LiveKitComponents.useMediaDeviceSelect).mockReturnValue({
      devices: [],
      activeDeviceId: 'device-1',
      setActiveMediaDevice: setActiveMediaDeviceMock,
    } as any);
  });

  describe('Rendering', () => {
    it('renders the track toggle with source and pressed state', () => {
      render(<AgentTrackControl kind="audioinput" source="microphone" pressed />);

      const toggle = screen.getByTestId('track-toggle');
      expect(toggle).toHaveAttribute('data-source', 'microphone');
      expect(toggle).toHaveAttribute('aria-pressed', 'true');
    });

    it('applies className to the control wrapper', () => {
      const { container } = render(
        <AgentTrackControl kind="videoinput" source="camera" className="custom-control" />,
      );

      expect(container.firstChild).toHaveClass('custom-control');
    });

    it('passes pending and disabled state to the toggle', () => {
      render(<AgentTrackControl kind="audioinput" source="microphone" pending disabled />);

      const toggle = screen.getByTestId('track-toggle');
      expect(toggle).toHaveAttribute('data-pending', 'true');
      expect(toggle).toBeDisabled();
    });
  });

  describe('Track Toggle', () => {
    it('calls onPressedChange when the toggle is clicked', async () => {
      const user = userEvent.setup();
      const handlePressedChange = vi.fn();

      render(
        <AgentTrackControl
          kind="audioinput"
          source="microphone"
          pressed={false}
          onPressedChange={handlePressedChange}
        />,
      );

      await user.click(screen.getByTestId('track-toggle'));

      expect(handlePressedChange).toHaveBeenCalledWith(true);
    });

    it('renders microphone visualizer when an audio track is provided', () => {
      render(
        <AgentTrackControl
          kind="audioinput"
          source="microphone"
          pressed
          audioTrack={{ source: 'microphone' } as any}
        />,
      );

      const visualizer = screen.getByTestId('audio-visualizer');
      expect(visualizer).toHaveAttribute('data-state', 'speaking');
      expect(visualizer).toHaveAttribute('data-has-track', 'true');
    });

    it('disconnects the microphone visualizer when pressed is false', () => {
      render(
        <AgentTrackControl
          kind="audioinput"
          source="microphone"
          pressed={false}
          audioTrack={{ source: 'microphone' } as any}
        />,
      );

      const visualizer = screen.getByTestId('audio-visualizer');
      expect(visualizer).toHaveAttribute('data-state', 'disconnected');
      expect(visualizer).toHaveAttribute('data-has-track', 'false');
    });
  });

  describe('Device Select', () => {
    it('does not render the device select when fewer than two devices are available', () => {
      vi.mocked(LiveKitComponents.useMediaDeviceSelect).mockReturnValue({
        devices: [{ deviceId: 'device-1', label: 'Built-in Mic' }],
        activeDeviceId: 'device-1',
        setActiveMediaDevice: setActiveMediaDeviceMock,
      } as any);

      render(<AgentTrackControl kind="audioinput" source="microphone" />);

      expect(screen.queryByTestId('device-select')).not.toBeInTheDocument();
    });

    it('filters empty device ids before rendering options', () => {
      vi.mocked(LiveKitComponents.useMediaDeviceSelect).mockReturnValue({
        devices: [
          { deviceId: '', label: 'Default' },
          { deviceId: 'device-1', label: 'Built-in Mic' },
          { deviceId: 'device-2', label: 'USB Mic' },
        ],
        activeDeviceId: 'device-1',
        setActiveMediaDevice: setActiveMediaDeviceMock,
      } as any);

      render(<AgentTrackControl kind="audioinput" source="microphone" />);

      expect(screen.getAllByTestId('select-item')).toHaveLength(2);
      expect(screen.queryByText('Default')).not.toBeInTheDocument();
    });

    it('requests permissions when the device select opens', async () => {
      const user = userEvent.setup();
      vi.mocked(LiveKitComponents.useMediaDeviceSelect).mockReturnValue({
        devices: [
          { deviceId: 'device-1', label: 'Built-in Camera' },
          { deviceId: 'device-2', label: 'USB Camera' },
        ],
        activeDeviceId: 'device-1',
        setActiveMediaDevice: setActiveMediaDeviceMock,
      } as any);

      render(<AgentTrackControl kind="videoinput" source="camera" />);

      expect(LiveKitComponents.useMediaDeviceSelect).toHaveBeenLastCalledWith(
        expect.objectContaining({ requestPermissions: false }),
      );

      await user.click(screen.getByTestId('open-select'));

      expect(LiveKitComponents.useMediaDeviceSelect).toHaveBeenLastCalledWith(
        expect.objectContaining({ requestPermissions: true }),
      );
    });

    it('updates the active media device and calls onActiveDeviceChange', async () => {
      const user = userEvent.setup();
      const handleActiveDeviceChange = vi.fn();
      vi.mocked(LiveKitComponents.useMediaDeviceSelect).mockReturnValue({
        devices: [
          { deviceId: 'device-1', label: 'Built-in Mic' },
          { deviceId: 'device-2', label: 'USB Mic' },
        ],
        activeDeviceId: 'device-1',
        setActiveMediaDevice: setActiveMediaDeviceMock,
      } as any);

      render(
        <AgentTrackControl
          kind="audioinput"
          source="microphone"
          onActiveDeviceChange={handleActiveDeviceChange}
        />,
      );

      await user.click(screen.getByTestId('choose-device'));

      expect(setActiveMediaDeviceMock).toHaveBeenCalledWith('device-2');
      expect(handleActiveDeviceChange).toHaveBeenCalledWith('device-2');
    });
  });
});
