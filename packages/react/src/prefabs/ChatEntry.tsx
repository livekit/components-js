import { ChatMessage, tokenize, TokenizeGrammar } from '@livekit/components-core';
import * as React from 'react';
import createEmailRegExp from 'email-regex';
import createUrlRegExp from 'url-regex';

export type MessageFormatter = (message: string) => React.ReactNode;

/**
 * ChatEntry composes the HTML div element under the hood, so you can pass all its props.
 * These are the props specific to the ChatEntry component:
 */
export interface ChatEntryProps extends React.HTMLAttributes<HTMLLIElement> {
  /**
   * The chat massage object to display.
   */
  entry: ChatMessage;
  /**
   * An optional formatter for the message body.
   */
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
export function ChatEntry({ entry, messageFormatter, ...props }: ChatEntryProps) {
  const formattedMessage = React.useMemo(() => {
    return messageFormatter ? messageFormatter(entry.message) : entry.message;
  }, [entry.message, messageFormatter]);

  return (
    <li
      className="lk-chat-entry"
      title={new Date(entry.timestamp).toLocaleTimeString()}
      data-lk-message-origin={entry.from?.isLocal ? 'local' : 'remote'}
      {...props}
    >
      <strong>{entry.from?.name ?? entry.from?.identity}</strong>
      <span>{formattedMessage}</span>
    </li>
  );
}

export function formatChatMessageLinks(message: string): React.ReactNode {
  const grammar: TokenizeGrammar = {
    email: createEmailRegExp(),
    url: createUrlRegExp({ strict: false }),
  };
  return tokenize(message, grammar).map((tok, i) => {
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
