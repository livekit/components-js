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

vi.mock('@/components/agents-ui/blocks/agent-session-view-01/components/tile-view', () => ({
  TileLayout: (props: any) => tileLayoutMock(props),
}));

vi.mock('@/components/agents-ui/agent-control-bar', () => ({
  AgentControlBar: (props: any) => agentControlBarMock(props),
}));

vi.mock('@/components/agents-ui/agent-chat-transcript', () => ({
  AgentChatTranscript: ({ className }: any) => (
    <div data-testid="agent-chat-transcript" className={className} />
  ),
}));

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
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
      render(<AgentSessionView_01 data-testid="session-view" className="custom-section-class" />);
      const section = screen.getByTestId('session-view');
      expect(section.tagName).toBe('SECTION');
      expect(section).toHaveClass('custom-section-class');
      expect(section).toHaveClass('bg-background');
    });

    it('applies style to the section element', () => {
      render(
        <AgentSessionView_01 data-testid="session-view" style={{ opacity: 0.9, minHeight: 100 }} />,
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
      render(<AgentSessionView_01 data-testid="session-view" isPreConnectBufferEnabled={true} />);
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

  describe('controls', () => {
    it('passes the default controls to AgentControlBar when unset', () => {
      render(<AgentSessionView_01 data-testid="session-view" />);
      const call = agentControlBarMock.mock.calls[0][0];
      expect(call.controls).toEqual({
        leave: true,
        microphone: true,
        chat: true,
        camera: true,
        screenShare: true,
      });
    });

    it('passes chat: false when controls.chat is false', () => {
      render(<AgentSessionView_01 data-testid="session-view" controls={{ chat: false }} />);
      const call = agentControlBarMock.mock.calls[0][0];
      expect(call.controls.chat).toBe(false);
    });

    it('passes camera: false when controls.camera is false', () => {
      render(<AgentSessionView_01 data-testid="session-view" controls={{ camera: false }} />);
      const call = agentControlBarMock.mock.calls[0][0];
      expect(call.controls.camera).toBe(false);
    });

    it('passes screenShare: false when controls.screenShare is false', () => {
      render(<AgentSessionView_01 data-testid="session-view" controls={{ screenShare: false }} />);
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

  describe('audioVisualizer prop passed to TileLayout', () => {
    it('passes audioVisualizer.type to TileLayout', () => {
      render(<AgentSessionView_01 data-testid="session-view" audioVisualizer={{ type: 'aura' }} />);
      const props = JSON.parse(screen.getByTestId('tile-layout').getAttribute('data-props')!);
      expect(props.audioVisualizer.type).toBe('aura');
    });

    it('passes audioVisualizer.color to TileLayout', () => {
      render(
        <AgentSessionView_01 data-testid="session-view" audioVisualizer={{ color: '#ff00ff' }} />,
      );
      const props = JSON.parse(screen.getByTestId('tile-layout').getAttribute('data-props')!);
      expect(props.audioVisualizer.color).toBe('#ff00ff');
    });

    it('passes audioVisualizer.colorShift to TileLayout for the wave type', () => {
      render(
        <AgentSessionView_01
          data-testid="session-view"
          audioVisualizer={{ type: 'wave', colorShift: 0.5 }}
        />,
      );
      const props = JSON.parse(screen.getByTestId('tile-layout').getAttribute('data-props')!);
      expect(props.audioVisualizer.colorShift).toBe(0.5);
    });

    it('passes audioVisualizer.barCount to TileLayout', () => {
      render(<AgentSessionView_01 data-testid="session-view" audioVisualizer={{ barCount: 11 }} />);
      const props = JSON.parse(screen.getByTestId('tile-layout').getAttribute('data-props')!);
      expect(props.audioVisualizer.barCount).toBe(11);
    });

    it('passes audioVisualizer.rowCount and audioVisualizer.columnCount to TileLayout', () => {
      render(
        <AgentSessionView_01
          data-testid="session-view"
          audioVisualizer={{ type: 'grid', rowCount: 8, columnCount: 12 }}
        />,
      );
      const props = JSON.parse(screen.getByTestId('tile-layout').getAttribute('data-props')!);
      expect(props.audioVisualizer.rowCount).toBe(8);
      expect(props.audioVisualizer.columnCount).toBe(12);
    });

    it('passes audioVisualizer.barCount and audioVisualizer.radius to TileLayout for the radial type', () => {
      render(
        <AgentSessionView_01
          data-testid="session-view"
          audioVisualizer={{ type: 'radial', barCount: 32, radius: 60 }}
        />,
      );
      const props = JSON.parse(screen.getByTestId('tile-layout').getAttribute('data-props')!);
      expect(props.audioVisualizer.barCount).toBe(32);
      expect(props.audioVisualizer.radius).toBe(60);
    });

    it('passes audioVisualizer.lineWidth to TileLayout for the wave type', () => {
      render(
        <AgentSessionView_01
          data-testid="session-view"
          audioVisualizer={{ type: 'wave', lineWidth: 3 }}
        />,
      );
      const props = JSON.parse(screen.getByTestId('tile-layout').getAttribute('data-props')!);
      expect(props.audioVisualizer.lineWidth).toBe(3);
    });

    it('passes the full audioVisualizer config to TileLayout when set', () => {
      const audioVisualizer = {
        type: 'grid' as const,
        color: '#00ff00' as const,
        rowCount: 6,
        columnCount: 8,
      };
      render(<AgentSessionView_01 data-testid="session-view" audioVisualizer={audioVisualizer} />);
      const props = JSON.parse(screen.getByTestId('tile-layout').getAttribute('data-props')!);
      expect(props.audioVisualizer).toMatchObject(audioVisualizer);
    });
  });

  describe('control bar controls together', () => {
    it('merges partial controls overrides with the defaults', () => {
      render(
        <AgentSessionView_01
          data-testid="session-view"
          controls={{ chat: false, camera: false, screenShare: false }}
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
