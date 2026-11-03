import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen, fireEvent, cleanup } from '@testing-library/react';
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
  MessageFooter: ({ children }: any) => <div data-testid="message-footer">{children}</div>,
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

describe('AgentChatTranscript scroll on send', () => {
  const remoteMessage = messages[1]!;
  const newLocalMessage: ReceivedMessage = {
    id: 'new-local',
    timestamp: 3,
    from: { isLocal: true } as ReceivedMessage['from'],
    message: 'New local message',
  };
  const newRemoteMessage: ReceivedMessage = {
    id: 'new-remote',
    timestamp: 3,
    from: { isLocal: false } as ReceivedMessage['from'],
    message: 'New remote message',
  };

  // Gives the viewport room to scroll, then scrolls away from the end the way a reader would.
  function scrollUp() {
    const viewport = screen.getByRole('region', { name: 'Messages' });
    Object.defineProperty(viewport, 'scrollHeight', { configurable: true, value: 1000 });
    Object.defineProperty(viewport, 'clientHeight', { configurable: true, value: 100 });
    fireEvent.wheel(viewport);
    vi.mocked(HTMLElement.prototype.scrollTo).mockClear();
  }

  it('scrolls to the end when a local message arrives after the reader scrolls up', () => {
    const { rerender } = render(<AgentChatTranscript messages={[remoteMessage]} />);
    scrollUp();

    rerender(<AgentChatTranscript messages={[remoteMessage, newLocalMessage]} />);

    expect(HTMLElement.prototype.scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ top: 900 }),
    );
  });

  it('stays put when a remote message arrives after the reader scrolls up', () => {
    const { rerender } = render(<AgentChatTranscript messages={[remoteMessage]} />);
    scrollUp();

    rerender(<AgentChatTranscript messages={[remoteMessage, newRemoteMessage]} />);

    expect(HTMLElement.prototype.scrollTo).not.toHaveBeenCalled();
  });

  it('stays put when a local message arrives with autoScroll off', () => {
    const { rerender } = render(
      <AgentChatTranscript messages={[remoteMessage]} autoScroll={false} />,
    );
    scrollUp();

    rerender(
      <AgentChatTranscript messages={[remoteMessage, newLocalMessage]} autoScroll={false} />,
    );

    expect(HTMLElement.prototype.scrollTo).not.toHaveBeenCalled();
  });

  it('scrolls once per local message as its text updates', () => {
    const { rerender } = render(
      <AgentChatTranscript messages={[remoteMessage, newLocalMessage]} />,
    );
    scrollUp();

    rerender(
      <AgentChatTranscript
        messages={[remoteMessage, { ...newLocalMessage, message: 'New local message, updated' }]}
      />,
    );

    expect(HTMLElement.prototype.scrollTo).not.toHaveBeenCalled();
  });
});

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

describe('AgentChatTranscript message text', () => {
  it('keeps line breaks in user messages', () => {
    render(
      <AgentChatTranscript
        messages={[{ id: 'user', timestamp: 1, from: { isLocal: true } as any, message: 'a\nb' }]}
      />,
    );

    const text = screen.getByTestId('message-response').firstElementChild;
    expect(text?.textContent).toBe('a\nb');
    expect(text).toHaveClass('whitespace-pre-wrap');
  });
});

describe('AgentChatTranscript failed messages', () => {
  const messages: ReceivedMessage[] = [
    { id: 'sent', timestamp: 1, from: { isLocal: true } as any, message: 'Sent', status: 'sent' },
    {
      id: 'failed',
      timestamp: 2,
      from: { isLocal: true } as any,
      message: 'Failed',
      status: 'failed',
    },
  ];

  it("marks messages that couldn't send", () => {
    render(<AgentChatTranscript messages={messages} />);

    expect(screen.getAllByText("Couldn't send.")).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });

  it('resends a failed message', () => {
    const onResend = vi.fn();
    render(<AgentChatTranscript messages={messages} onResend={onResend} />);

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(onResend).toHaveBeenCalledExactlyOnceWith('failed');
  });

  it('shows a retried message as sending until it settles', () => {
    const { rerender } = render(<AgentChatTranscript messages={messages} onResend={vi.fn()} />);
    const withStatus = (status: 'sending' | 'sent' | 'failed') =>
      messages.map((message) => (message.id === 'failed' ? { ...message, status } : message));

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    rerender(<AgentChatTranscript messages={withStatus('sending')} onResend={vi.fn()} />);
    expect(screen.getByText('Sending…')).toBeInTheDocument();

    rerender(<AgentChatTranscript messages={withStatus('failed')} onResend={vi.fn()} />);
    expect(screen.queryByText('Sending…')).not.toBeInTheDocument();
    expect(screen.getByText("Couldn't send.")).toBeInTheDocument();

    rerender(<AgentChatTranscript messages={withStatus('sent')} onResend={vi.fn()} />);
    expect(screen.queryByText('Sending…')).not.toBeInTheDocument();
    expect(screen.queryByText("Couldn't send.")).not.toBeInTheDocument();
  });

  it('keeps first sends quiet', () => {
    render(
      <AgentChatTranscript
        messages={[{ ...messages[0], id: 'new', status: 'sending' }]}
        onResend={vi.fn()}
      />,
    );

    expect(screen.queryByText('Sending…')).not.toBeInTheDocument();
  });

  it('uses custom labels', () => {
    render(
      <AgentChatTranscript
        messages={messages}
        onResend={vi.fn()}
        labels={{ failed: 'No se pudo enviar.', retry: 'Reintentar' }}
      />,
    );

    expect(screen.getByText('No se pudo enviar.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });

  it('announces a message that fails, and again if a retry fails', () => {
    const withStatus = (status: 'sending' | 'failed') =>
      messages.map((message) => (message.id === 'failed' ? { ...message, status } : message));
    const { rerender, container } = render(
      <AgentChatTranscript messages={withStatus('sending')} onResend={vi.fn()} />,
    );
    const region = container.querySelector('[aria-live="polite"]');
    expect(region).toBeEmptyDOMElement();

    rerender(<AgentChatTranscript messages={withStatus('failed')} onResend={vi.fn()} />);
    const firstAnnouncement = region?.firstElementChild;
    expect(firstAnnouncement).toHaveTextContent("Message couldn't send");

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    rerender(<AgentChatTranscript messages={withStatus('sending')} onResend={vi.fn()} />);
    rerender(<AgentChatTranscript messages={withStatus('failed')} onResend={vi.fn()} />);
    // A new node, so screen readers announce it again
    expect(region?.firstElementChild).toHaveTextContent("Message couldn't send");
    expect(region?.firstElementChild).not.toBe(firstAnnouncement);
  });

  it("doesn't announce an older failure when a newer one is retried", () => {
    const older = { ...messages[1], id: 'older' };
    const withStatus = (status: 'sending' | 'failed') => [
      older,
      { ...messages[1], id: 'newer', status },
    ];
    const { rerender, container } = render(
      <AgentChatTranscript messages={withStatus('sending')} onResend={vi.fn()} />,
    );
    const region = container.querySelector('[aria-live="polite"]');

    rerender(<AgentChatTranscript messages={withStatus('failed')} onResend={vi.fn()} />);
    expect(region).toHaveTextContent("Message couldn't send");

    rerender(<AgentChatTranscript messages={withStatus('sending')} onResend={vi.fn()} />);
    expect(region).toBeEmptyDOMElement();
  });

  it("doesn't announce failures already on screen", () => {
    const { container } = render(<AgentChatTranscript messages={messages} onResend={vi.fn()} />);

    expect(container.querySelector('[aria-live="polite"]')).toBeEmptyDOMElement();
  });

  it('uses the default for a label passed as undefined', () => {
    render(
      <AgentChatTranscript messages={messages} onResend={vi.fn()} labels={{ retry: undefined }} />,
    );

    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});

describe('AgentChatTranscript new message announcements', () => {
  const agent = { isLocal: false } as any;
  const user = { isLocal: true } as any;
  const agentMessage = (id: string, message: string): ReceivedMessage => ({
    id,
    timestamp: 1,
    type: 'agentTranscript',
    from: agent,
    message,
  });
  const region = (container: HTMLElement) => container.querySelector('[aria-live="polite"]');

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("doesn't announce messages already on screen", () => {
    const { container } = render(<AgentChatTranscript messages={[agentMessage('a', 'Hello')]} />);

    act(() => vi.advanceTimersByTime(2000));
    expect(region(container)).toBeEmptyDOMElement();
  });

  it('announces a new agent message once it stops changing', () => {
    const { container, rerender } = render(<AgentChatTranscript messages={[]} />);

    rerender(<AgentChatTranscript messages={[agentMessage('a', 'Hello')]} />);
    act(() => vi.advanceTimersByTime(500));
    rerender(<AgentChatTranscript messages={[agentMessage('a', 'Hello, how can I help?')]} />);
    act(() => vi.advanceTimersByTime(500));
    expect(region(container)).toBeEmptyDOMElement();

    act(() => vi.advanceTimersByTime(500));
    expect(region(container)).toHaveTextContent('Agent: Hello, how can I help?');
  });

  it('announces only the new text when a message keeps going after a pause', () => {
    const { container, rerender } = render(<AgentChatTranscript messages={[]} />);

    rerender(<AgentChatTranscript messages={[agentMessage('a', 'First sentence.')]} />);
    act(() => vi.advanceTimersByTime(1000));
    rerender(
      <AgentChatTranscript messages={[agentMessage('a', 'First sentence. Second sentence.')]} />,
    );
    act(() => vi.advanceTimersByTime(1000));

    expect(region(container)).toHaveTextContent(/^Second sentence\.$/);
  });

  it("doesn't announce your own messages", () => {
    const { container, rerender } = render(<AgentChatTranscript messages={[]} />);

    rerender(
      <AgentChatTranscript
        messages={[{ id: 'u', timestamp: 1, from: user, message: 'Hi', status: 'sent' }]}
      />,
    );
    act(() => vi.advanceTimersByTime(2000));
    expect(region(container)).toBeEmptyDOMElement();
  });

  it('reads Markdown as plain text', () => {
    const { container, rerender } = render(<AgentChatTranscript messages={[]} />);

    rerender(
      <AgentChatTranscript
        messages={[agentMessage('a', '**Done.** See [the docs](https://example.com) for `setup`.')]}
      />,
    );
    act(() => vi.advanceTimersByTime(1000));
    expect(region(container)).toHaveTextContent('Agent: Done. See the docs for setup.');
  });

  it('uses a custom announcement label', () => {
    const { container, rerender } = render(
      <AgentChatTranscript messages={[]} labels={{ messageAnnouncement: (m) => `Ava: ${m}` }} />,
    );

    rerender(
      <AgentChatTranscript
        messages={[agentMessage('a', 'Hi')]}
        labels={{ messageAnnouncement: (m) => `Ava: ${m}` }}
      />,
    );
    act(() => vi.advanceTimersByTime(1000));
    expect(region(container)).toHaveTextContent('Ava: Hi');
  });

  it('treats transcript updates for one segment as one message', () => {
    const segment = (id: string, message: string): ReceivedMessage => ({
      ...agentMessage(id, message),
      attributes: { 'lk.segment_id': 'segment-1' },
    });
    const { container, rerender } = render(<AgentChatTranscript messages={[]} />);

    rerender(<AgentChatTranscript messages={[segment('stream-1', 'First sentence.')]} />);
    act(() => vi.advanceTimersByTime(1000));
    rerender(
      <AgentChatTranscript messages={[segment('stream-2', 'First sentence. Second sentence.')]} />,
    );
    act(() => vi.advanceTimersByTime(1000));

    expect(region(container)).toHaveTextContent(/^Second sentence\.$/);
  });

  it('keeps text after a pause that starts like a list item', () => {
    const { container, rerender } = render(<AgentChatTranscript messages={[]} />);

    rerender(<AgentChatTranscript messages={[agentMessage('a', 'The total is')]} />);
    act(() => vi.advanceTimersByTime(1000));
    rerender(
      <AgentChatTranscript messages={[agentMessage('a', 'The total is 42. Anything else?')]} />,
    );
    act(() => vi.advanceTimersByTime(1000));

    expect(region(container)).toHaveTextContent(/^42\. Anything else\?$/);
  });

  it('keeps lone Markdown symbols', () => {
    const { container, rerender } = render(<AgentChatTranscript messages={[]} />);

    rerender(<AgentChatTranscript messages={[agentMessage('a', 'Set user_id to 5 * 3.')]} />);
    act(() => vi.advanceTimersByTime(1000));

    expect(region(container)).toHaveTextContent('Agent: Set user_id to 5 * 3.');
  });

  it('names a participant who is not an agent', () => {
    const { container, rerender } = render(<AgentChatTranscript messages={[]} />);

    rerender(
      <AgentChatTranscript
        messages={[
          {
            id: 'b',
            timestamp: 1,
            from: { isLocal: false, isAgent: false, name: 'Bob' } as any,
            message: 'Hi all',
          },
        ]}
      />,
    );
    act(() => vi.advanceTimersByTime(1000));

    expect(region(container)).toHaveTextContent('Bob: Hi all');
  });

  it('names the sender of a message that was mid-stream on mount', () => {
    const { container, rerender } = render(
      <AgentChatTranscript messages={[agentMessage('a', 'Here are')]} />,
    );

    rerender(<AgentChatTranscript messages={[agentMessage('a', 'Here are three options')]} />);
    act(() => vi.advanceTimersByTime(1000));

    expect(region(container)).toHaveTextContent('Agent: three options');
  });

  it("skips spoken transcripts with announceMessages='typed'", () => {
    const typed: ReceivedMessage = { id: 't', timestamp: 2, from: agent, message: 'Typed reply' };
    const { container, rerender } = render(
      <AgentChatTranscript messages={[]} announceMessages="typed" />,
    );

    rerender(
      <AgentChatTranscript
        messages={[agentMessage('a', 'Spoken reply'), typed]}
        announceMessages="typed"
      />,
    );
    act(() => vi.advanceTimersByTime(1000));

    expect(region(container)).toHaveTextContent(/^Agent: Typed reply$/);
  });

  it('announces nothing with announceMessages="none"', () => {
    const { container, rerender } = render(
      <AgentChatTranscript messages={[]} announceMessages="none" />,
    );

    rerender(<AgentChatTranscript messages={[agentMessage('a', 'Hi')]} announceMessages="none" />);
    act(() => vi.advanceTimersByTime(1000));

    expect(region(container)).toBeEmptyDOMElement();
  });

  it('uses the default announcement label when passed undefined', () => {
    const labels = { messageAnnouncement: undefined };
    const { container, rerender } = render(<AgentChatTranscript messages={[]} labels={labels} />);

    rerender(<AgentChatTranscript messages={[agentMessage('a', 'Hi')]} labels={labels} />);
    act(() => vi.advanceTimersByTime(1000));

    expect(region(container)).toHaveTextContent('Agent: Hi');
  });

  it('announces a rewritten message again in full', () => {
    const { container, rerender } = render(<AgentChatTranscript messages={[]} />);

    rerender(<AgentChatTranscript messages={[agentMessage('a', 'Meet at 5')]} />);
    act(() => vi.advanceTimersByTime(1000));
    rerender(<AgentChatTranscript messages={[agentMessage('a', 'Meet at 6')]} />);
    act(() => vi.advanceTimersByTime(1000));

    expect(region(container)).toHaveTextContent(/^Agent: Meet at 6$/);
  });

  it("doesn't announce history that loads after mount", () => {
    const { container, rerender } = render(<AgentChatTranscript messages={[]} />);

    rerender(
      <AgentChatTranscript
        messages={[agentMessage('a', 'One'), agentMessage('b', 'Two'), agentMessage('c', 'Three')]}
      />,
    );
    act(() => vi.advanceTimersByTime(2000));

    expect(region(container)).toBeEmptyDOMElement();
  });

  it("doesn't announce earlier messages loaded above the conversation", () => {
    const { container, rerender } = render(
      <AgentChatTranscript messages={[agentMessage('b', 'Latest')]} />,
    );

    rerender(
      <AgentChatTranscript
        messages={[agentMessage('a', 'Earlier'), agentMessage('b', 'Latest')]}
      />,
    );
    act(() => vi.advanceTimersByTime(2000));

    expect(region(container)).toBeEmptyDOMElement();
  });

  it("doesn't let one long reply hold back another message", () => {
    const person: ReceivedMessage = {
      id: 'p',
      timestamp: 1,
      from: { isLocal: false, isAgent: false, name: 'Bob' } as any,
      message: 'Quick question',
    };
    const { container, rerender } = render(<AgentChatTranscript messages={[]} />);

    let reply = 'Streaming';
    rerender(<AgentChatTranscript messages={[person, agentMessage('a', reply)]} />);
    for (let tick = 0; tick < 3; tick++) {
      act(() => vi.advanceTimersByTime(500));
      reply += ' more';
      rerender(<AgentChatTranscript messages={[person, agentMessage('a', reply)]} />);
    }

    expect(region(container)).toHaveTextContent(/^Bob: Quick question$/);
  });

  it('waits for an unfinished link before announcing', () => {
    const { container, rerender } = render(<AgentChatTranscript messages={[]} />);

    rerender(<AgentChatTranscript messages={[agentMessage('a', 'See [the docs](https://exa')]} />);
    act(() => vi.advanceTimersByTime(1500));
    expect(region(container)).toBeEmptyDOMElement();

    rerender(
      <AgentChatTranscript
        messages={[agentMessage('a', 'See [the docs](https://example.com).')]}
      />,
    );
    act(() => vi.advanceTimersByTime(1000));
    expect(region(container)).toHaveTextContent(/^Agent: See the docs\.$/);
  });

  it('announces an unfinished link after waiting a while', () => {
    const { container, rerender } = render(<AgentChatTranscript messages={[]} />);

    rerender(<AgentChatTranscript messages={[agentMessage('a', 'Use `npm')]} />);
    act(() => vi.advanceTimersByTime(3000));
    expect(region(container)).toBeEmptyDOMElement();

    act(() => vi.advanceTimersByTime(1000));
    expect(region(container)).toHaveTextContent('Agent: Use `npm');
  });
});
