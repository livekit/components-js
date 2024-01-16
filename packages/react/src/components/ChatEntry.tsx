import type { ChatMessage, ReceivedChatMessage } from '@livekit/components-core';
import { tokenize, createDefaultGrammar } from '@livekit/components-core';
import * as React from 'react';
import { useHover } from 'usehooks-ts';

/** @public */
export type MessageFormatter = (message: string) => React.ReactNode;

/**
 * ChatEntry composes the HTML div element under the hood, so you can pass all its props.
 * These are the props specific to the ChatEntry component:
 * @public
 */
export interface ChatEntryProps extends React.HTMLAttributes<HTMLLIElement> {
  /** The chat massage object to display. */
  entry: ReceivedChatMessage;
  /** Hide sender name. Useful when displaying multiple consecutive chat messages from the same person. */
  hideName?: boolean;
  /** Hide message timestamp. */
  hideTimestamp?: boolean;
  /** An optional formatter for the message body. */
  messageFormatter?: MessageFormatter;
  /** edit callback */
  onEdit?: (msg: ChatMessage) => void;
}

/**
 * The `ChatEntry` component holds and displays one chat message.
 *
 * @example
 * ```tsx
 * <Chat>
 *   <ChatEntry />
 * </Chat>
 * ```
 * @see `Chat`
 * @public
 */
export function ChatEntry({
  entry,
  hideName = false,
  hideTimestamp = false,
  messageFormatter,
  onEdit,
  ...props
}: ChatEntryProps) {
  const formattedMessage = React.useMemo(() => {
    return messageFormatter ? messageFormatter(entry.message) : entry.message;
  }, [entry.message, messageFormatter]);
  const listElement = React.useRef(null);
  const hasBeenEdited = !!entry.editTimestamp;
  const isHovering = useHover(listElement);
  const time = new Date(entry.timestamp);
  const locale = navigator ? navigator.language : 'en-US';
  const [editMessage, setEditMessage] = React.useState(entry.message);

  console.log(entry.from);

  const [isEditing, setIsEditing] = React.useState(false);

  const commitEdit = () => {
    if (isEditing && editMessage !== entry.message) {
      onEdit?.({
        ...entry,
        message: editMessage,
      });
    }
    setIsEditing((value) => !value);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditMessage(entry.message);
  };

  return (
    <li
      className="lk-chat-entry"
      ref={listElement}
      title={time.toLocaleTimeString(locale, { timeStyle: 'full' })}
      data-lk-message-origin={entry.from?.isLocal ? 'local' : 'remote'}
      {...props}
    >
      {(!hideTimestamp || !hideName || hasBeenEdited) && (
        <span className="lk-meta-data">
          {!hideName && (
            <strong className="lk-participant-name">
              {entry.from?.name ?? entry.from?.identity}
            </strong>
          )}

          {(!hideTimestamp || hasBeenEdited) && (
            <span className="lk-timestamp">
              {hasBeenEdited && 'edited '}
              {time.toLocaleTimeString(locale, { timeStyle: 'short' })}
            </span>
          )}
        </span>
      )}

      <span className="lk-message-container">
        {isEditing ? (
          <textarea
            className="lk-message-body"
            value={editMessage}
            onChange={(ev) => setEditMessage(ev.target.value)}
            onKeyDown={(ev) => {
              if (ev.key === 'Enter') {
                commitEdit();
              } else if (ev.key === 'Escape') {
                cancelEdit();
              }
            }}
          />
        ) : (
          <span className="lk-message-body">{formattedMessage}</span>
        )}
        {entry.from?.isLocal && (isHovering || isEditing) && (
          <button className="lk-button lk-edit-button" onClick={commitEdit}>
            {isEditing ? 'save' : 'edit'}
          </button>
        )}
      </span>
    </li>
  );
}

/** @public */
export function formatChatMessageLinks(message: string): React.ReactNode {
  return tokenize(message, createDefaultGrammar()).map((tok, i) => {
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
