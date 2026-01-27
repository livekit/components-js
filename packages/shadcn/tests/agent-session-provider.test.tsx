import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AgentSessionProvider } from '@/components/agents-ui/agent-session-provider';
import * as LiveKitComponents from '@livekit/components-react';

const sessionProviderMock = vi.fn(({ children }: any) => (
  <div data-testid="session-provider">{children}</div>
));

const roomAudioRendererMock = vi.fn((props: any) => (
  <div data-testid="room-audio-renderer" {...props} />
));

// Mock the @livekit/components-react components
vi.mock('@livekit/components-react', () => ({
  SessionProvider: (props: any) => sessionProviderMock(props),
  RoomAudioRenderer: (props: any) =>
    (roomAudioRendererMock as unknown as (props: any, context?: any) => JSX.Element)(props, {}),
}));

describe('AgentSessionProvider', () => {
  const mockSession = {
    room: null,
    state: 'disconnected',
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders children', () => {
      render(
        <AgentSessionProvider session={mockSession}>
          <div>Test Child</div>
        </AgentSessionProvider>,
      );
      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });

    it('renders SessionProvider wrapper', () => {
      render(
        <AgentSessionProvider session={mockSession}>
          <div>Content</div>
        </AgentSessionProvider>,
      );
      expect(screen.getByTestId('session-provider')).toBeInTheDocument();
    });

    it('renders RoomAudioRenderer', () => {
      render(
        <AgentSessionProvider session={mockSession}>
          <div>Content</div>
        </AgentSessionProvider>,
      );
      expect(screen.getByTestId('room-audio-renderer')).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('passes session prop to SessionProvider', () => {
      const session = { room: null, state: 'connected' } as any;
      render(
        <AgentSessionProvider session={session}>
          <div>Content</div>
        </AgentSessionProvider>,
      );
      const lastCall = sessionProviderMock.mock.calls.at(-1)?.[0] ?? {};
      expect(lastCall).toEqual(expect.objectContaining({ session }));
    });

    it('passes volume prop to RoomAudioRenderer', () => {
      render(
        <AgentSessionProvider session={mockSession} volume={0.5}>
          <div>Content</div>
        </AgentSessionProvider>,
      );
      const lastCall = roomAudioRendererMock.mock.calls.at(-1)?.[0] ?? {};
      expect(lastCall).toEqual(expect.objectContaining({ volume: 0.5 }));
    });

    it('passes muted prop to RoomAudioRenderer', () => {
      render(
        <AgentSessionProvider session={mockSession} muted={true}>
          <div>Content</div>
        </AgentSessionProvider>,
      );
      const lastCall = roomAudioRendererMock.mock.calls.at(-1)?.[0] ?? {};
      expect(lastCall).toEqual(expect.objectContaining({ muted: true }));
    });

    it('passes room prop to RoomAudioRenderer', () => {
      const mockRoom = {} as any;
      render(
        <AgentSessionProvider session={mockSession} room={mockRoom}>
          <div>Content</div>
        </AgentSessionProvider>,
      );
      expect(roomAudioRendererMock).toHaveBeenCalledWith(
        expect.objectContaining({ room: mockRoom }),
        expect.anything(),
      );
    });
  });

  describe('Children Rendering', () => {
    it('renders single child', () => {
      render(
        <AgentSessionProvider session={mockSession}>
          <div>Single Child</div>
        </AgentSessionProvider>,
      );
      expect(screen.getByText('Single Child')).toBeInTheDocument();
    });

    it('renders multiple children', () => {
      render(
        <AgentSessionProvider session={mockSession}>
          <div>Child 1</div>
          <div>Child 2</div>
          <div>Child 3</div>
        </AgentSessionProvider>,
      );
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
      expect(screen.getByText('Child 3')).toBeInTheDocument();
    });

    it('renders complex children structure', () => {
      render(
        <AgentSessionProvider session={mockSession}>
          <div>
            <h1>Title</h1>
            <p>Description</p>
          </div>
        </AgentSessionProvider>,
      );
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('renders both SessionProvider and RoomAudioRenderer together', () => {
      render(
        <AgentSessionProvider session={mockSession}>
          <div>Content</div>
        </AgentSessionProvider>,
      );
      expect(screen.getByTestId('session-provider')).toBeInTheDocument();
      expect(screen.getByTestId('room-audio-renderer')).toBeInTheDocument();
    });

    it('passes all audio renderer props correctly', () => {
      render(
        <AgentSessionProvider session={mockSession} volume={0.75} muted={false}>
          <div>Content</div>
        </AgentSessionProvider>,
      );
      const lastCall = roomAudioRendererMock.mock.calls.at(-1)?.[0] ?? {};
      expect(lastCall).toEqual(expect.objectContaining({ volume: 0.75, muted: false }));
    });
  });

  describe('Edge Cases', () => {
    it('handles null session gracefully', () => {
      render(
        <AgentSessionProvider session={null as any}>
          <div>Content</div>
        </AgentSessionProvider>,
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('handles empty children', () => {
      const { container } = render(
        <AgentSessionProvider session={mockSession}>{null}</AgentSessionProvider>,
      );
      expect(container.querySelector('[data-testid="session-provider"]')).toBeInTheDocument();
    });
  });
});
