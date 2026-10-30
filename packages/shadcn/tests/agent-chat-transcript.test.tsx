import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import type { ReceivedMessage } from '@livekit/components-react';
import {
  AgentChatTranscript,
  type AgentChatTranscriptProps,
} from '@/components/agents-ui/agent-chat-transcript';

vi.mock('@/components/ui/message', () => ({
  Message: ({ children, align, title }: any) => (
    <div
      data-testid="chat-message"
      data-from={align === 'end' ? 'user' : 'assistant'}
      data-title={title}
    >
      {children}
    </div>
  ),
  MessageContent: ({ children }: any) => <div data-testid="message-content">{children}</div>,
}));

vi.mock('@/components/ui/bubble', () => ({
  Bubble: ({ children }: any) => <>{children}</>,
  BubbleContent: ({ children }: any) => <div data-testid="message-response">{children}</div>,
}));

vi.mock('streamdown', () => ({
  Streamdown: ({ children }: any) => <>{children}</>,
}));

vi.mock('@/components/agents-ui/agent-chat-indicator', () => ({
  AgentChatIndicator: () => <div data-testid="chat-indicator" />,
}));

vi.mock('motion/react', () => ({
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const originalScrollTo = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollTo');

beforeEach(() => {
  // jsdom has no layout/scrolling; retain the real scroller primitives and
  // assert the anchor metadata they use to position messages in the browser.
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
    configurable: true,
    value: vi.fn(),
  });
});

afterEach(() => {
  cleanup();
  if (originalScrollTo) Object.defineProperty(HTMLElement.prototype, 'scrollTo', originalScrollTo);
  else Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo');
});

describe('AgentChatTranscript', () => {
  it('renders by default', () => {
    render(<AgentChatTranscript data-testid="transcript" />);
    expect(screen.getByTestId('transcript')).toBeInTheDocument();
  });

  it('applies html attributes (id, class, style, aria)', () => {
    render(
      <AgentChatTranscript
        id="transcript"
        className="custom-class"
        style={{ opacity: 0.8 }}
        aria-label="Agent transcript"
      />,
    );
    const transcript = screen.getByLabelText('Agent transcript');
    expect(transcript).toHaveAttribute('id', 'transcript');
    expect(transcript).toHaveClass('custom-class');
    expect(transcript).toHaveStyle({ opacity: '0.8' });
  });

  it('applies click handler', () => {
    const onClick = vi.fn();
    render(<AgentChatTranscript data-testid="transcript" onClick={onClick} />);
    const transcript = screen.getByTestId('transcript');
    fireEvent.click(transcript);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders messages with user/assistant origins', () => {
    render(
      <AgentChatTranscript
        messages={[
          {
            id: '1',
            timestamp: Date.now(),
            from: { isLocal: true },
            message: 'Hello',
          } as any,
          {
            id: '2',
            timestamp: Date.now(),
            from: { isLocal: false },
            message: 'Hi there',
          } as any,
        ]}
      />,
    );

    const messages = screen.getAllByTestId('chat-message');
    expect(messages).toHaveLength(2);
    expect(messages[0]).toHaveAttribute('data-from', 'user');
    expect(messages[1]).toHaveAttribute('data-from', 'assistant');
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there')).toBeInTheDocument();
  });

  it('shows thinking indicator when agent is thinking', () => {
    render(<AgentChatTranscript agentState="thinking" />);
    expect(screen.getByTestId('chat-indicator')).toBeInTheDocument();
  });

  it('always renders scroll button', () => {
    render(<AgentChatTranscript />);
    expect(screen.getByText('Scroll to end').closest('button')).toBeInTheDocument();
  });
});

const messages: ReceivedMessage[] = [
  {
    id: 'local',
    timestamp: 0,
    from: { isLocal: true } as ReceivedMessage['from'],
    message: 'Local message',
  },
  {
    id: 'remote',
    timestamp: 1,
    from: { isLocal: false } as ReceivedMessage['from'],
    message: 'Remote message',
  },
  { id: 'unspecified', timestamp: 2, message: 'Message without sender' },
];

describe('AgentChatTranscript scroll anchors', () => {
  function anchorFlags() {
    return messages.map(({ message }) =>
      screen.getByText(message).closest('[data-message-id]')?.getAttribute('data-scroll-anchor'),
    );
  }

  it.each<{
    mode: AgentChatTranscriptProps['scrollAnchor'];
    expected: string[];
  }>([
    { mode: true, expected: ['true', 'true', 'true'] },
    { mode: 'any', expected: ['true', 'true', 'true'] },
    { mode: false, expected: ['false', 'false', 'false'] },
    { mode: undefined, expected: ['false', 'false', 'false'] },
    { mode: 'user', expected: ['true', 'false', 'false'] },
    { mode: 'other', expected: ['false', 'true', 'true'] },
  ])('maps $mode to the expected message anchors', ({ mode, expected }) => {
    render(<AgentChatTranscript messages={messages} scrollAnchor={mode} />);
    expect(anchorFlags()).toEqual(expected);
  });

  it('updates existing anchors when the mode changes without remounting messages', () => {
    const { rerender } = render(<AgentChatTranscript messages={messages} scrollAnchor={false} />);
    const firstMessage = screen.getByText('Local message').closest('[data-message-id]');
    rerender(<AgentChatTranscript messages={messages} scrollAnchor />);
    expect(anchorFlags()).toEqual(['true', 'true', 'true']);
    expect(screen.getByText('Local message').closest('[data-message-id]')).toBe(firstMessage);
    rerender(<AgentChatTranscript messages={messages} scrollAnchor="user" />);
    expect(anchorFlags()).toEqual(['true', 'false', 'false']);
    rerender(<AgentChatTranscript messages={messages} scrollAnchor={false} />);
    expect(anchorFlags()).toEqual(['false', 'false', 'false']);
  });

  it('does not make the thinking indicator a message anchor', () => {
    render(<AgentChatTranscript messages={messages} scrollAnchor agentState="thinking" />);
    const indicator = screen.getByRole('status').closest('[data-slot="message-scroller-item"]');
    expect(indicator).toHaveAttribute('data-scroll-anchor', 'false');
    expect(indicator).not.toHaveAttribute('data-message-id');
  });
});
