import { tokenize, defaultGrammar, ReceivedChatMessage } from '@livekit/components-core';
import * as React from 'react';

export type MessageFormatter = (message: string) => React.ReactNode;

/**
 * ChatEntry composes the HTML div element under the hood, so you can pass all its props.
 * These are the props specific to the ChatEntry component:
 */
export interface ChatEntryProps extends React.HTMLAttributes<HTMLLIElement> {
  /** The chat massage object to display. */
  entry: ReceivedChatMessage;
  /** Hide name and time. Useful when displaying multiple consecutive chat messages from the same person. */
  hideMetaData?: boolean;
  /** An optional formatter for the message body. */
  messageFormatter?: MessageFormatter;
}

/**
 * The ChatEntry component holds and displays one chat message.
 *
 * @example
 * ```tsx
 * {...}
 *   <Chat>
 *     <ChatEntry />
 *   </Chat>
 * {...}
 * ```
 */
export function ChatEntry({
  entry,
  hideMetaData = false,
  messageFormatter,
  ...props
}: ChatEntryProps) {
  const formattedMessage = React.useMemo(() => {
    return messageFormatter ? messageFormatter(entry.message) : entry.message;
  }, [entry.message, messageFormatter]);
  const time = new Date(entry.timestamp);
  const locale = navigator ? navigator.language : 'en-US';

  return (
    <li
      className="lk-chat-entry"
      title={time.toLocaleTimeString(locale, { timeStyle: 'full' })}
      data-lk-message-origin={entry.from?.isLocal ? 'local' : 'remote'}
      {...props}
    >
      {!hideMetaData && (
        <span className="lk-meta-data" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <strong>{entry.from?.name ?? entry.from?.identity}</strong>{' '}
          <span>{time.toLocaleTimeString(locale, { timeStyle: 'short' })}</span>
        </span>
      )}
      <span className="lk-message-body">{formattedMessage}</span>
    </li>
  );
}

export function formatChatMessageLinks(message: string): React.ReactNode {
  return tokenize(message, defaultGrammar).map((tok, i) => {
    if (typeof tok === `string`) {
      return tok;
    } else {
      const content = tok.content.toString();
      const href =
        tok.type === `url`
          ? /^http(s?):\/\//.test(content)
            ? content
            : `https://${content}`
          : `mailto:${content}`;
      return (
        <a className="lk-chat-link" key={i} href={href} target="_blank" rel="noreferrer">
          {content}
        </a>
      );
    }
  });
}
