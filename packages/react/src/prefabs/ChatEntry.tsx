import { ChatMessage } from '@livekit/components-core';
import * as React from 'react';
import createUrlRegExp from 'url-regex';
import createEmailRegExp from 'email-regex';
import Prism from 'prismjs';

const GRAMMAR: Prism.Grammar = {
  email: createEmailRegExp(),
  url: createUrlRegExp({ strict: false }),
};

/**
 * ChatEntry composes the HTML div element under the hood, so you can pass all its props.
 * These are the props specific to the ChatEntry component:
 */
export interface ChatEntryProps extends React.HTMLAttributes<HTMLLIElement> {
  /**
   * The chat massage object to display.
   */
  entry: ChatMessage;
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
export function ChatEntry({ entry, ...props }: ChatEntryProps) {
  const message = React.useMemo<React.ReactNode[]>(() => {
    return Prism.tokenize(entry.message, GRAMMAR).map((tok, i) => {
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
  }, [entry.message]);

  return (
    <li
      className="lk-chat-entry"
      title={new Date(entry.timestamp).toLocaleTimeString()}
      data-lk-message-origin={entry.from?.isLocal ? 'local' : 'remote'}
      {...props}
    >
      <strong>{entry.from?.name ?? entry.from?.identity}</strong>
      <span>{message}</span>
    </li>
  );
}
