'use client';

import { type ComponentProps, useEffect, useRef, useState } from 'react';
import { type AgentState, type ReceivedMessage } from '@livekit/components-react';
import { Streamdown } from 'streamdown';
import { Bubble, BubbleContent } from '@/components/ui/bubble';
import { Message, MessageContent } from '@/components/ui/message';
import { Marker, MarkerContent, MarkerIcon } from '@/components/ui/marker';
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  useMessageScroller,
} from '@/components/ui/message-scroller';
import { AgentChatIndicator } from '@/components/agents-ui/agent-chat-indicator';

/**
 * Props for the AgentChatTranscript component.
 */
export interface AgentChatTranscriptProps
  extends
    ComponentProps<'div'>,
    ComponentProps<typeof MessageScrollerProvider>,
    ComponentProps<typeof MessageScrollerViewport>,
    ComponentProps<typeof MessageScrollerContent> {
  /**
   * Whether to automatically scroll to the bottom of the transcript when new messages are added.
   * Sending a message also jumps to the bottom, even if the reader had scrolled up, unless
   * `scrollAnchor` already anchors local messages.
   * @defaultValue true
   */
  autoScroll?: boolean;
  /**
   * Which messages to use as scroll anchors when auto-scrolling.
   * `true` and `'any'` anchor every message; `false` leaves messages unanchored.
   * `'user'` anchors local messages; `'other'` anchors non-local messages.
   * @defaultValue false
   */
  scrollAnchor?: boolean | 'user' | 'other' | 'any';
  /**
   * The scroll button render function
   */
  scrollButtonRender?: ComponentProps<typeof MessageScrollerButton>['render'];
  /**
   * The scroll button behavior
   */
  scrollButtonBehavior?: ComponentProps<typeof MessageScrollerButton>['behavior'];
  /**
   * The scroll button direction
   */
  scrollButtonDirection?: ComponentProps<typeof MessageScrollerButton>['direction'];
  /**
   * The current state of the agent. When 'thinking', displays a loading indicator.
   */
  agentState?: AgentState;
  /**
   * Array of messages to display in the transcript.
   * @defaultValue []
   */
  messages?: ReceivedMessage[];
  /** Text the transcript shows and announces. */
  labels?: Partial<AgentChatTranscriptLabels>;
  /**
   * Which new messages from others to announce to screen readers. `'typed'` skips spoken
   * transcripts, for sessions where the agent's voice already says them aloud.
   * @defaultValue 'all'
   */
  announceMessages?: 'all' | 'typed' | 'none';
  /**
   * Additional CSS class names to apply to the conversation container.
   */
  className?: string;
}

/**
 * Text the transcript shows and announces. Pass any of these to `AgentChatTranscript`'s `labels`
 * to translate or reword them.
 */
export interface AgentChatTranscriptLabels {
  /** Beside the indicator while the agent is thinking. */
  thinking: string;
  /**
   * Announced to screen readers for a new message from the agent or another participant. Gets the
   * text to read and the message it's from.
   */
  messageAnnouncement: (text: string, message: ReceivedMessage) => string;
}

export const defaultAgentChatTranscriptLabels: AgentChatTranscriptLabels = {
  thinking: 'Thinking...',
  messageAnnouncement: (text, { from }) =>
    `${(from && !from.isAgent && (from.name || from.identity)) || 'Agent'}: ${text}`,
};

/** Fills in defaults for any label that's missing or `undefined`, such as an untranslated one. */
function withDefaultLabels(
  labels: Partial<AgentChatTranscriptLabels> = {},
): AgentChatTranscriptLabels {
  return {
    thinking: labels.thinking ?? defaultAgentChatTranscriptLabels.thinking,
    messageAnnouncement:
      labels.messageAnnouncement ?? defaultAgentChatTranscriptLabels.messageAnnouncement,
  };
}

/**
 * How long a message has to stop changing before it's announced, so streaming text isn't read word
 * by word.
 */
const ANNOUNCE_SETTLE_MS = 1000;

/**
 * Reads Markdown as plain text: keeps the words of links, emphasis, and code, and drops the
 * punctuation around them that screen readers would read aloud. Leaves lone symbols such as
 * `5 * 3` or `user_id` alone.
 */
function toSpokenText(markdown: string) {
  return markdown
    .replace(/^\s*```.*$/gm, '')
    .replace(/`([^`\n]+)`/g, '$1')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/(\*\*|__|~~)(?=\S)([^\n]*?\S)\1/g, '$2')
    .replace(/(^|[^\w*])\*(?=\S)([^*\n]*?\S)\*(?![\w*])/g, '$1$2')
    .replace(/(^|[^\w])_(?=\S)([^_\n]*?\S)_(?!\w)/g, '$1$2')
    .replace(/^\s{0,3}(#{1,6}|>|[-*+])\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Transcription updates for one segment arrive as new streams with new IDs, so key them by
 * segment to see them as one growing message.
 */
function announcementKey(message: ReceivedMessage) {
  return message.attributes?.['lk.segment_id'] ?? message.id;
}

/**
 * What to announce for messages from the agent and other participants once they stop changing.
 * Each announcement has a new `key`, so rendering it as a new node announces it even if the text
 * repeats.
 */
function useMessageAnnouncement(
  messages: ReceivedMessage[],
  labels: AgentChatTranscriptLabels,
  announceMessages: 'all' | 'typed' | 'none',
) {
  const remoteMessages = messages.filter(
    (message) =>
      !message.from?.isLocal &&
      announceMessages !== 'none' &&
      (announceMessages === 'all' || message.type === undefined || message.type === 'chatMessage'),
  );
  // How much of each message's spoken text has been announced, and whether its sender has been.
  // Seeded with what's already on screen, so mounting doesn't read out the history.
  const [announced] = useState(
    () =>
      new Map(
        remoteMessages.map((message) => [
          announcementKey(message),
          { length: toSpokenText(message.message).length, named: false },
        ]),
      ),
  );
  const [announcement, setAnnouncement] = useState<{ key: number; text: string }>();
  const latestRef = useRef({ remoteMessages, labels });
  useEffect(() => {
    latestRef.current = { remoteMessages, labels };
  });

  // Restarts the wait only when a message arrives or changes, not on every render
  const changeKey = remoteMessages
    .map((message) => `${announcementKey(message)}:${message.message.length}`)
    .join('\n');

  useEffect(() => {
    const timer = setTimeout(() => {
      const { remoteMessages, labels } = latestRef.current;
      const parts: string[] = [];

      for (const message of remoteMessages) {
        const key = announcementKey(message);
        const spoken = toSpokenText(message.message);
        const previous = announced.get(key) ?? { length: 0, named: false };
        if (spoken.length <= previous.length) continue;

        // A message that keeps going after a pause announces only what's new
        const text = spoken.slice(previous.length).trim();
        if (text) parts.push(previous.named ? text : labels.messageAnnouncement(text, message));
        announced.set(key, { length: spoken.length, named: true });
      }

      if (parts.length > 0) {
        setAnnouncement((previous) => ({ key: (previous?.key ?? 0) + 1, text: parts.join(' ') }));
      }
    }, ANNOUNCE_SETTLE_MS);

    return () => clearTimeout(timer);
  }, [changeKey, announced]);

  return announcement;
}

function ScrollToEndOnLocalMessage({ messages }: { messages: ReceivedMessage[] }) {
  const { scrollToEnd } = useMessageScroller();
  const lastMessage = messages.at(-1);
  const lastLocalMessageId = lastMessage?.from?.isLocal ? lastMessage.id : undefined;
  // Seeded with the current message so mounting doesn't scroll; `defaultScrollPosition` covers that
  const handledMessageIdRef = useRef(lastLocalMessageId);

  useEffect(() => {
    if (!lastLocalMessageId || lastLocalMessageId === handledMessageIdRef.current) return;
    handledMessageIdRef.current = lastLocalMessageId;
    scrollToEnd();
  }, [lastLocalMessageId, scrollToEnd]);

  return null;
}

/**
 * A chat transcript component that displays a conversation between the user and agent.
 * Shows messages with timestamps and origin indicators, plus a thinking indicator
 * when the agent is processing.
 *
 * @extends ComponentProps<'div'>, ComponentProps<typeof MessageScrollerProvider>, ComponentProps<typeof MessageScrollerViewport>, ComponentProps<typeof MessageScrollerContent>
 *
 *
 * @example
 * ```tsx
 * <AgentChatTranscript
 *   agentState={agentState}
 *   messages={chatMessages}
 * />
 * ```
 */
export function AgentChatTranscript({
  scrollAnchor,
  autoScroll = true,
  scrollMargin,
  scrollEdgeThreshold,
  preserveScrollOnPrepend,
  scrollPreviousItemPeek,
  defaultScrollPosition = 'last-anchor',
  scrollButtonRender,
  scrollButtonBehavior,
  scrollButtonDirection,
  spacerClassName,
  agentState,
  messages = [],
  labels: labelsProp,
  announceMessages = 'all',
  className,
  ...props
}: AgentChatTranscriptProps) {
  const labels = withDefaultLabels(labelsProp);
  const anchorsLocalMessages =
    scrollAnchor === true || scrollAnchor === 'any' || scrollAnchor === 'user';
  const messageAnnouncement = useMessageAnnouncement(messages, labels, announceMessages);

  return (
    <MessageScrollerProvider
      autoScroll={autoScroll}
      scrollMargin={scrollMargin}
      defaultScrollPosition={defaultScrollPosition}
      scrollEdgeThreshold={scrollEdgeThreshold}
      scrollPreviousItemPeek={scrollPreviousItemPeek}
    >
      {autoScroll && !anchorsLocalMessages && <ScrollToEndOnLocalMessage messages={messages} />}
      <div aria-live="polite" className="sr-only">
        {messageAnnouncement && (
          <span key={`message-${messageAnnouncement.key}`}>{messageAnnouncement.text}</span>
        )}
      </div>
      <MessageScroller className={className} {...props}>
        <MessageScrollerViewport preserveScrollOnPrepend={preserveScrollOnPrepend}>
          <MessageScrollerContent
            spacerClassName={spacerClassName}
            aria-busy={agentState === 'thinking'}
          >
            {messages.map((receivedMessage) => {
              const { id, timestamp, from, message } = receivedMessage;
              const time = new Date(timestamp);
              const isUser = from?.isLocal;
              const locale = typeof navigator !== 'undefined' ? navigator.language : 'en-US';
              const title = time.toLocaleTimeString(locale, { timeStyle: 'full' });
              let _scrollAnchor = false;

              if (
                scrollAnchor === true ||
                scrollAnchor === 'any' ||
                (scrollAnchor === 'user' && isUser) ||
                (scrollAnchor === 'other' && !isUser)
              ) {
                _scrollAnchor = true;
              }

              return (
                <MessageScrollerItem key={id} messageId={id} scrollAnchor={_scrollAnchor}>
                  <Message align={isUser ? 'end' : 'start'} title={title}>
                    <MessageContent>
                      <Bubble
                        align={isUser ? 'end' : 'start'}
                        variant={isUser ? 'secondary' : 'ghost'}
                      >
                        <BubbleContent>
                          {/* Typed text, not Markdown, so its line breaks stay as written */}
                          {isUser ? (
                            <div className="whitespace-pre-wrap">{message}</div>
                          ) : (
                            <Streamdown>{message}</Streamdown>
                          )}
                        </BubbleContent>
                      </Bubble>
                    </MessageContent>
                  </Message>
                </MessageScrollerItem>
              );
            })}

            {/* Agent is thinking indicator */}
            {agentState === 'thinking' && (
              <MessageScrollerItem>
                <Marker role="status">
                  <MarkerIcon>
                    <AgentChatIndicator size="sm" />
                  </MarkerIcon>
                  <MarkerContent className="shimmer">{labels.thinking}</MarkerContent>
                </Marker>
              </MessageScrollerItem>
            )}
          </MessageScrollerContent>
        </MessageScrollerViewport>

        {/* Scroll to bottom button */}
        <MessageScrollerButton
          variant="outline"
          className="rounded-full"
          render={scrollButtonRender}
          behavior={scrollButtonBehavior}
          direction={scrollButtonDirection}
        />
      </MessageScroller>
    </MessageScrollerProvider>
  );
}
