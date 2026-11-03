'use client';

import { type ComponentProps, useEffect, useRef, useState } from 'react';
import { type AgentState, type ReceivedMessage } from '@livekit/components-react';
import { CircleAlertIcon, LoaderIcon } from 'lucide-react';
import { Streamdown } from 'streamdown';
import { Bubble, BubbleContent } from '@/components/ui/bubble';
import { Message, MessageContent, MessageFooter } from '@/components/ui/message';
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
  /**
   * Sends a failed message again, such as `resend` from `useSessionMessages`. When provided, failed
   * messages show a retry button, and a retried message shows that it's sending until it settles.
   */
  onResend?: (messageId: string) => void;
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
  /** Under a message that couldn't send. */
  failed: string;
  /** The button that sends a failed message again. */
  retry: string;
  /** Under a retried message while it sends. */
  sending: string;
  /** Announced to screen readers when a message can't send. */
  failedAnnouncement: string;
  /** Beside the indicator while the agent is thinking. */
  thinking: string;
  /**
   * Announced to screen readers for a new message from the agent or another participant. Gets the
   * text to read and the message it's from.
   */
  messageAnnouncement: (text: string, message: ReceivedMessage) => string;
}

export const defaultAgentChatTranscriptLabels: AgentChatTranscriptLabels = {
  failed: "Couldn't send.",
  retry: 'Try again',
  sending: 'Sending…',
  failedAnnouncement: "Message couldn't send",
  thinking: 'Thinking...',
  messageAnnouncement: (text, { from }) =>
    `${(from && !from.isAgent && (from.name || from.identity)) || 'Agent'}: ${text}`,
};

/** Fills in defaults for any label that's missing or `undefined`, such as an untranslated one. */
function withDefaultLabels(
  labels: Partial<AgentChatTranscriptLabels> = {},
): AgentChatTranscriptLabels {
  return {
    failed: labels.failed ?? defaultAgentChatTranscriptLabels.failed,
    retry: labels.retry ?? defaultAgentChatTranscriptLabels.retry,
    sending: labels.sending ?? defaultAgentChatTranscriptLabels.sending,
    failedAnnouncement:
      labels.failedAnnouncement ?? defaultAgentChatTranscriptLabels.failedAnnouncement,
    thinking: labels.thinking ?? defaultAgentChatTranscriptLabels.thinking,
    messageAnnouncement:
      labels.messageAnnouncement ?? defaultAgentChatTranscriptLabels.messageAnnouncement,
  };
}

/**
 * The message to announce as failed: the latest one that failed since the last render, kept while
 * it stays failed. Messages that were already failed, such as an older one left after a retry,
 * aren't announced again.
 */
function useNewlyFailedMessage(messages: ReceivedMessage[]) {
  const failedIds = messages
    .filter((message) => 'status' in message && message.status === 'failed')
    .map((message) => message.id);
  // Seeded with what's already failed, so mounting doesn't announce old failures
  const previousFailedIdsRef = useRef(new Set(failedIds));
  const [announced, setAnnounced] = useState<{ id: string; key: number }>();
  const failedIdsKey = failedIds.join('\n');

  useEffect(() => {
    const ids = failedIdsKey ? failedIdsKey.split('\n') : [];
    const newlyFailedId = ids.filter((id) => !previousFailedIdsRef.current.has(id)).at(-1);
    previousFailedIdsRef.current = new Set(ids);
    if (newlyFailedId) {
      setAnnounced((previous) => ({ id: newlyFailedId, key: (previous?.key ?? 0) + 1 }));
    }
  }, [failedIdsKey]);

  return announced && failedIds.includes(announced.id) ? announced : undefined;
}

/**
 * How long a message has to stop changing before it's announced, so streaming text isn't read word
 * by word.
 */
const ANNOUNCE_SETTLE_MS = 1000;

/** The longest an unfinished link or code span waits to finish before it's announced anyway. */
const ANNOUNCE_MAX_HOLD_MS = 3000;

/** This many new messages at once are loaded history, not a live conversation. */
const HISTORY_BATCH_SIZE = 3;

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

/** Whether Markdown stops partway through a link or code span, so reading it now would garble it. */
function hasUnfinishedMarkdown(markdown: string) {
  return (
    /\[[^\]]*$/.test(markdown) ||
    /\]\([^)]*$/.test(markdown) ||
    (markdown.match(/`/g)?.length ?? 0) % 2 === 1
  );
}

interface TrackedMessage {
  /** The message's text the last time it changed. */
  seen: string;
  /** When it last changed. */
  changedAt: number;
  /** The spoken text announced so far. */
  announced: string;
  /** Whether the sender has been named. */
  named: boolean;
  /** When it started waiting for unfinished Markdown. */
  heldSince?: number;
}

/**
 * What to announce for messages from the agent and other participants once they stop changing.
 * Each announcement has a new `key`, so rendering it as a new node announces it even if the text
 * repeats.
 *
 * Each message waits for its own pause, so a long reply doesn't hold back others. A message that
 * keeps going after a pause announces only what's new, and one that's rewritten announces again in
 * full. History stays quiet: what's on screen at mount, messages that arrive together, and messages
 * placed before ones already here.
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
  const [tracked] = useState(
    () =>
      new Map<string, TrackedMessage>(
        remoteMessages.map((message) => [announcementKey(message), asHistory(message)]),
      ),
  );
  const [announcement, setAnnouncement] = useState<{ key: number; text: string }>();
  const latestRef = useRef({ remoteMessages, labels });
  useEffect(() => {
    latestRef.current = { remoteMessages, labels };
  });
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Changes only when a message arrives or its text changes, not on every render
  const changeKey = remoteMessages
    .map((message) => `${announcementKey(message)}\u0000${message.message}`)
    .join('\u0001');

  useEffect(() => {
    const announceSettled = () => {
      const { remoteMessages, labels } = latestRef.current;
      const now = Date.now();
      const parts: string[] = [];
      let nextCheckAt = Infinity;

      for (const message of remoteMessages) {
        const entry = tracked.get(announcementKey(message));
        const spoken = toSpokenText(message.message);
        if (!entry || spoken === entry.announced) continue;

        const settlesAt = entry.changedAt + ANNOUNCE_SETTLE_MS;
        if (now < settlesAt) {
          nextCheckAt = Math.min(nextCheckAt, settlesAt);
          continue;
        }
        if (hasUnfinishedMarkdown(message.message)) {
          entry.heldSince ??= now;
          const releasesAt = entry.heldSince + ANNOUNCE_MAX_HOLD_MS;
          if (now < releasesAt) {
            nextCheckAt = Math.min(nextCheckAt, releasesAt);
            continue;
          }
        }

        const continues = spoken.startsWith(entry.announced);
        const text = continues ? spoken.slice(entry.announced.length).trim() : spoken;
        if (text) {
          parts.push(continues && entry.named ? text : labels.messageAnnouncement(text, message));
        }
        entry.announced = spoken;
        entry.named = true;
        entry.heldSince = undefined;
      }

      if (parts.length > 0) {
        setAnnouncement((previous) => ({ key: (previous?.key ?? 0) + 1, text: parts.join(' ') }));
      }
      if (nextCheckAt !== Infinity) {
        timerRef.current = setTimeout(announceSettled, nextCheckAt - now);
      }
    };

    const { remoteMessages } = latestRef.current;
    const now = Date.now();
    const unknown = remoteMessages.filter((message) => !tracked.has(announcementKey(message)));
    let lastKnownIndex = -1;
    remoteMessages.forEach((message, index) => {
      if (tracked.has(announcementKey(message))) lastKnownIndex = index;
    });

    remoteMessages.forEach((message, index) => {
      const key = announcementKey(message);
      const entry = tracked.get(key);
      if (!entry) {
        const isHistory = unknown.length >= HISTORY_BATCH_SIZE || index < lastKnownIndex;
        tracked.set(
          key,
          isHistory
            ? asHistory(message)
            : { seen: message.message, changedAt: now, announced: '', named: false },
        );
      } else if (entry.seen !== message.message) {
        entry.seen = message.message;
        entry.changedAt = now;
      }
    });

    // Check again when the first waiting message settles, not a full pause after the latest change
    let firstSettlesAt = Infinity;
    for (const message of remoteMessages) {
      const entry = tracked.get(announcementKey(message));
      if (entry && toSpokenText(message.message) !== entry.announced) {
        firstSettlesAt = Math.min(firstSettlesAt, entry.changedAt + ANNOUNCE_SETTLE_MS);
      }
    }
    clearTimeout(timerRef.current);
    if (firstSettlesAt !== Infinity) {
      timerRef.current = setTimeout(announceSettled, Math.max(0, firstSettlesAt - now));
    }
  }, [changeKey, tracked]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return announcement;
}

/** Tracks a message as already read, so it isn't announced. */
function asHistory(message: ReceivedMessage): TrackedMessage {
  return {
    seen: message.message,
    changedAt: 0,
    announced: toSpokenText(message.message),
    named: false,
  };
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
  onResend,
  labels: labelsProp,
  announceMessages = 'all',
  className,
  ...props
}: AgentChatTranscriptProps) {
  const labels = withDefaultLabels(labelsProp);
  const anchorsLocalMessages =
    scrollAnchor === true || scrollAnchor === 'any' || scrollAnchor === 'user';
  // First sends stay quiet so they feel instant; only retries show that they're in progress
  const [retriedIds, setRetriedIds] = useState<ReadonlySet<string>>(() => new Set());
  const failure = useNewlyFailedMessage(messages);
  const messageAnnouncement = useMessageAnnouncement(messages, labels, announceMessages);

  const handleResend = (id: string) => {
    setRetriedIds((previous) => new Set(previous).add(id));
    onResend?.(id);
  };

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
        {failure && (
          // A new node for each failure, so failing again after a retry announces again
          <span key={`failed-${failure.key}`}>{labels.failedAnnouncement}</span>
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
              const status = 'status' in receivedMessage ? receivedMessage.status : undefined;
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
                  <Message align={isUser ? 'end' : 'start'} title={title} data-status={status}>
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
                      {status === 'sending' && retriedIds.has(id) && (
                        <MessageFooter className="text-muted-foreground gap-1.5">
                          <LoaderIcon className="size-3.5 animate-spin" aria-hidden />
                          <span>{labels.sending}</span>
                        </MessageFooter>
                      )}
                      {status === 'failed' && (
                        <MessageFooter className="text-destructive gap-1.5">
                          <CircleAlertIcon className="size-3.5" aria-hidden />
                          <span>{labels.failed}</span>
                          {onResend && (
                            <button
                              type="button"
                              onClick={() => handleResend(id)}
                              className="cursor-pointer underline underline-offset-2 hover:no-underline"
                            >
                              {labels.retry}
                            </button>
                          )}
                        </MessageFooter>
                      )}
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
