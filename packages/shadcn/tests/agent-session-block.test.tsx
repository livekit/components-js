import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { AgentSessionView_01 } from '@/components/agents-ui/blocks/agent-session-view-01/components/agent-session-block';

const mockSession = {
  isConnected: true,
  end: vi.fn(),
} as any;

const mockMessages: any[] = [];

vi.mock('@livekit/components-react', () => ({
  useSessionContext: () => mockSession,
  useSessionMessages: () => ({ messages: mockMessages }),
  useAgent: () => ({ state: 'listening' }),
}));

const tileLayoutMock = vi.fn((props: any) => (
  <div data-testid="tile-layout" data-props={JSON.stringify(props)} />
));

const agentControlBarMock = vi.fn((props: any) => (
  <div data-testid="agent-control-bar" data-props={JSON.stringify(props)} />
));

vi.mock(
  '@/components/agents-ui/blocks/agent-session-view-01/components/tile-view',
  () => ({
    TileLayout: (props: any) => tileLayoutMock(props),
  }),
);

vi.mock('@/components/agents-ui/agent-control-bar', () => ({
  AgentControlBar: (props: any) => agentControlBarMock(props),
}));

vi.mock('@/components/agents-ui/agent-chat-transcript', () => ({
  AgentChatTranscript: ({ className }: any) => (
    <div data-testid="agent-chat-transcript" className={className} />
  ),
}));

vi.mock('@/components/ai-elements/shimmer', () => ({
  Shimmer: ({ children, ...props }: any) => (
    <div data-testid="shimmer" {...props}>
      {children}
    </div>
  ),
}));

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    create: (Component: any) => (props: any) => (
      <Component {...props} data-testid="motion-shimmer" />
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('AgentSessionView_01', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMessages.length = 0;
  });

  describe('style, className, and ref', () => {
    it('applies className to the section element', () => {
      render(
        <AgentSessionView_01
          data-testid="session-view"
          className="custom-section-class"
        />,
      );
      const section = screen.getByTestId('session-view');
      expect(section.tagName).toBe('SECTION');
      expect(section).toHaveClass('custom-section-class');
      expect(section).toHaveClass('bg-background');
    });

    it('applies style to the section element', () => {
      render(
        <AgentSessionView_01
          data-testid="session-view"
          style={{ opacity: 0.9, minHeight: 100 }}
        />,
      );
      const section = screen.getByTestId('session-view');
      expect(section).toHaveStyle({ opacity: '0.9', minHeight: '100px' });
    });

    it('forwards ref to the section element', () => {
      const ref = React.createRef<HTMLElement>();
      render(<AgentSessionView_01 ref={ref} data-testid="session-view" />);
      expect(ref.current).toBeInstanceOf(HTMLElement);
      expect(ref.current?.tagName).toBe('SECTION');
      expect(ref.current).toBe(screen.getByTestId('session-view'));
    });

    it('applies html attributes (id, aria)', () => {
      render(
        <AgentSessionView_01
          data-testid="session-view"
          id="agent-session-01"
          aria-label="Agent session view"
        />,
      );
      const section = screen.getByTestId('session-view');
      expect(section).toHaveAttribute('id', 'agent-session-01');
      expect(section).toHaveAttribute('aria-label', 'Agent session view');
    });
  });

  describe('preConnectMessage', () => {
    it('shows default pre-connect message when no messages and buffer enabled', () => {
      render(
        <AgentSessionView_01
          data-testid="session-view"
          isPreConnectBufferEnabled={true}
        />,
      );
      expect(screen.getByText('Agent is listening, ask it a question')).toBeInTheDocument();
    });

    it('shows custom preConnectMessage when provided', () => {
      render(
        <AgentSessionView_01
          data-testid="session-view"
          preConnectMessage="Please wait, connecting..."
          isPreConnectBufferEnabled={true}
        />,
      );
      expect(screen.getByText('Please wait, connecting...')).toBeInTheDocument();
    });
  });

  describe('supportsChatInput', () => {
    it('passes chat: true to AgentControlBar by default', () => {
      render(<AgentSessionView_01 data-testid="session-view" />);
      const call = agentControlBarMock.mock.calls[0][0];
      expect(call.controls).toEqual(
        expect.objectContaining({ chat: true, leave: true, microphone: true }),
      );
    });

    it('passes chat: false when supportsChatInput is false', () => {
      render(
        <AgentSessionView_01
          data-testid="session-view"
          supportsChatInput={false}
        />,
      );
      const call = agentControlBarMock.mock.calls[0][0];
      expect(call.controls.chat).toBe(false);
    });
  });

  describe('supportsVideoInput', () => {
    it('passes camera: true to AgentControlBar by default', () => {
      render(<AgentSessionView_01 data-testid="session-view" />);
      const call = agentControlBarMock.mock.calls[0][0];
      expect(call.controls.camera).toBe(true);
    });

    it('passes camera: false when supportsVideoInput is false', () => {
      render(
        <AgentSessionView_01
          data-testid="session-view"
          supportsVideoInput={false}
        />,
      );
      const call = agentControlBarMock.mock.calls[0][0];
      expect(call.controls.camera).toBe(false);
    });
  });

  describe('supportsScreenShare', () => {
    it('passes screenShare: true to AgentControlBar by default', () => {
      render(<AgentSessionView_01 data-testid="session-view" />);
      const call = agentControlBarMock.mock.calls[0][0];
      expect(call.controls.screenShare).toBe(true);
    });

    it('passes screenShare: false when supportsScreenShare is false', () => {
      render(
        <AgentSessionView_01
          data-testid="session-view"
          supportsScreenShare={false}
        />,
      );
      const call = agentControlBarMock.mock.calls[0][0];
      expect(call.controls.screenShare).toBe(false);
    });
  });

  describe('isPreConnectBufferEnabled', () => {
    it('shows pre-connect message when true and no messages', () => {
      render(
        <AgentSessionView_01
          data-testid="session-view"
          isPreConnectBufferEnabled={true}
          preConnectMessage="Waiting..."
        />,
      );
      expect(screen.getByText('Waiting...')).toBeInTheDocument();
    });

    it('hides pre-connect message when isPreConnectBufferEnabled is false', () => {
      render(
        <AgentSessionView_01
          data-testid="session-view"
          isPreConnectBufferEnabled={false}
          preConnectMessage="Should not appear"
        />,
      );
      expect(screen.queryByText('Should not appear')).not.toBeInTheDocument();
    });
  });

  describe('audioVisualizer props passed to TileLayout', () => {
    it('passes audioVisualizerType to TileLayout', () => {
      render(
        <AgentSessionView_01
          data-testid="session-view"
          audioVisualizerType="aura"
        />,
      );
      const props = JSON.parse(
        screen.getByTestId('tile-layout').getAttribute('data-props')!,
      );
      expect(props.audioVisualizerType).toBe('aura');
    });

    it('passes audioVisualizerColor to TileLayout', () => {
      render(
        <AgentSessionView_01
          data-testid="session-view"
          audioVisualizerColor="#ff00ff"
        />,
      );
      const props = JSON.parse(
        screen.getByTestId('tile-layout').getAttribute('data-props')!,
      );
      expect(props.audioVisualizerColor).toBe('#ff00ff');
    });

    it('passes audioVisualizerColorShift to TileLayout', () => {
      render(
        <AgentSessionView_01
          data-testid="session-view"
          audioVisualizerColorShift={0.5}
        />,
      );
      const props = JSON.parse(
        screen.getByTestId('tile-layout').getAttribute('data-props')!,
      );
      expect(props.audioVisualizerColorShift).toBe(0.5);
    });

    it('passes audioVisualizerBarCount to TileLayout', () => {
      render(
        <AgentSessionView_01
          data-testid="session-view"
          audioVisualizerBarCount={11}
        />,
      );
      const props = JSON.parse(
        screen.getByTestId('tile-layout').getAttribute('data-props')!,
      );
      expect(props.audioVisualizerBarCount).toBe(11);
    });

    it('passes audioVisualizerGridRowCount and audioVisualizerGridColumnCount to TileLayout', () => {
      render(
        <AgentSessionView_01
          data-testid="session-view"
          audioVisualizerGridRowCount={8}
          audioVisualizerGridColumnCount={12}
        />,
      );
      const props = JSON.parse(
        screen.getByTestId('tile-layout').getAttribute('data-props')!,
      );
      expect(props.audioVisualizerGridRowCount).toBe(8);
      expect(props.audioVisualizerGridColumnCount).toBe(12);
    });

    it('passes audioVisualizerRadialBarCount and audioVisualizerRadialRadius to TileLayout', () => {
      render(
        <AgentSessionView_01
          data-testid="session-view"
          audioVisualizerRadialBarCount={32}
          audioVisualizerRadialRadius={60}
        />,
      );
      const props = JSON.parse(
        screen.getByTestId('tile-layout').getAttribute('data-props')!,
      );
      expect(props.audioVisualizerRadialBarCount).toBe(32);
      expect(props.audioVisualizerRadialRadius).toBe(60);
    });

    it('passes audioVisualizerWaveLineWidth to TileLayout', () => {
      render(
        <AgentSessionView_01
          data-testid="session-view"
          audioVisualizerWaveLineWidth={3}
        />,
      );
      const props = JSON.parse(
        screen.getByTestId('tile-layout').getAttribute('data-props')!,
      );
      expect(props.audioVisualizerWaveLineWidth).toBe(3);
    });

    it('passes all audio visualizer props to TileLayout when set', () => {
      const visualizerProps = {
        audioVisualizerType: 'grid' as const,
        audioVisualizerColor: '#00ff00' as const,
        audioVisualizerColorShift: 1,
        audioVisualizerBarCount: 7,
        audioVisualizerGridRowCount: 6,
        audioVisualizerGridColumnCount: 8,
        audioVisualizerRadialBarCount: 16,
        audioVisualizerRadialRadius: 90,
        audioVisualizerWaveLineWidth: 2,
      };
      render(
        <AgentSessionView_01 data-testid="session-view" {...visualizerProps} />,
      );
      const props = JSON.parse(
        screen.getByTestId('tile-layout').getAttribute('data-props')!,
      );
      expect(props).toMatchObject(visualizerProps);
    });
  });

  describe('control bar controls together', () => {
    it('passes all controls false when all support props are false', () => {
      render(
        <AgentSessionView_01
          data-testid="session-view"
          supportsChatInput={false}
          supportsVideoInput={false}
          supportsScreenShare={false}
        />,
      );
      const call = agentControlBarMock.mock.calls[0][0];
      expect(call.controls).toEqual({
        leave: true,
        microphone: true,
        chat: false,
        camera: false,
        screenShare: false,
      });
    });
  });
});
