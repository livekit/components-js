'use client';

import { type ComponentProps, useEffect, useRef } from 'react';
import { type AgentState, type ReceivedMessage } from '@livekit/components-react';
import { CircleAlertIcon } from 'lucide-react';
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
   * messages show a retry button.
   */
  onResend?: (messageId: string) => void;
  /**
   * Additional CSS class names to apply to the conversation container.
   */
  className?: string;
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
  className,
  ...props
}: AgentChatTranscriptProps) {
  const anchorsLocalMessages =
    scrollAnchor === true || scrollAnchor === 'any' || scrollAnchor === 'user';

  return (
    <MessageScrollerProvider
      autoScroll={autoScroll}
      scrollMargin={scrollMargin}
      defaultScrollPosition={defaultScrollPosition}
      scrollEdgeThreshold={scrollEdgeThreshold}
      scrollPreviousItemPeek={scrollPreviousItemPeek}
    >
      {autoScroll && !anchorsLocalMessages && <ScrollToEndOnLocalMessage messages={messages} />}
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
                          <Streamdown>{message}</Streamdown>
                        </BubbleContent>
                      </Bubble>
                      {status === 'failed' && (
                        <MessageFooter className="text-destructive gap-1.5">
                          <CircleAlertIcon className="size-3.5" aria-hidden />
                          <span>Not sent.</span>
                          {onResend && (
                            <button
                              type="button"
                              onClick={() => onResend(id)}
                              className="underline underline-offset-2 hover:no-underline"
                            >
                              Try again
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
                  <MarkerContent className="shimmer">Thinking...</MarkerContent>
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
