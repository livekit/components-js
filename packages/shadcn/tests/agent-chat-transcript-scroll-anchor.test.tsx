import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import type { ReceivedMessage } from '@livekit/components-react';
import {
  AgentChatTranscript,
  type AgentChatTranscriptProps,
} from '@/components/agents-ui/agent-chat-transcript';

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

const originalScrollTo = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollTo');

describe('AgentChatTranscript scroll anchors', () => {
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
    if (originalScrollTo)
      Object.defineProperty(HTMLElement.prototype, 'scrollTo', originalScrollTo);
    else Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo');
  });

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
