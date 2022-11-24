import { ChatMessage } from '@livekit/components-core';
import * as React from 'react';

/**
 * ChatEntry composes the HTML div element under the hood, so you can pass all its props.
 * These are the props specific to the ChatEntry component:
 */
export interface ChatEntryProps extends React.HTMLAttributes<HTMLDivElement> {
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
 * import { Chat, ChatEntry } from '@livekit/components-react';
 *
 * {...}
 *   <Chat>
 *     <ChatEntry />
 *   </Chat>
 * {...}
 * ```
 */
export function ChatEntry({ entry, ...props }: ChatEntryProps) {
  return (
    <div {...props}>
      <em>{entry.from?.name ?? entry.from?.identity}</em>: {entry.message}
    </div>
  );
}
