import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentChatTranscript } from '@/components/agents-ui/agent-chat-transcript';

vi.mock('@/components/ui/message-scroller', () => ({
  MessageScrollerProvider: ({ children }: any) => <>{children}</>,
  MessageScroller: ({ children, ...props }: any) => (
    <div data-testid="conversation" {...props}>
      {children}
    </div>
  ),
  MessageScrollerViewport: ({ children }: any) => <>{children}</>,
  MessageScrollerContent: ({ children }: any) => (
    <div data-testid="conversation-content">{children}</div>
  ),
  MessageScrollerItem: ({ children }: any) => <>{children}</>,
  MessageScrollerButton: () => <div data-testid="scroll-button" />,
}));

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
    expect(screen.getByTestId('scroll-button')).toBeInTheDocument();
  });
});
