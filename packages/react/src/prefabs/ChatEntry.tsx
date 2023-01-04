import { ChatMessage } from '@livekit/components-core';
import * as React from 'react';

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
  return (
    <li
      className="lk-chat-entry"
      title={new Date(entry.timestamp).toLocaleTimeString()}
      data-lk-message-origin={entry.from?.isLocal ? 'local' : 'remote'}
      {...props}
    >
      <strong>{entry.from?.name ?? entry.from?.identity}</strong>
      {entry.message}
    </li>
  );
}
