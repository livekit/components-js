import { ChatMessage, setupChat } from '@livekit/components-core';
import { Room } from 'livekit-client';
import * as React from 'react';
import { useRoomContext } from '../contexts';
import { cloneSingleChild, useObservableState } from '../utils';

export interface ChatProps extends React.HTMLAttributes<HTMLDivElement> {}

export function useChat() {
  const room = useRoomContext();
  const { isSendingObservable, messageObservable, send } = React.useMemo(
    () => setupChat(room),
    [room],
  );
  const isSending = useObservableState(isSendingObservable, false);
  const chatMessages = useObservableState(messageObservable, []);
  return { send, chatMessages, isSending };
}

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
 * @examples
 * ```ts
 * import { Chat, ChatEntry } from '@livekit/components-react';
 *
 * <Chat>
 *     <ChatEntry>
 * </Chat>
 * ```
 *
 * @param param0
 * @returns
 */
export function ChatEntry({ entry, ...props }: ChatEntryProps) {
  return (
    <div {...props}>
      <em>{entry.from?.name ?? entry.from?.identity}</em>: {entry.message}
    </div>
  );
}

/**
 * The Chat component allows the sending of text messages to the entry room.
 *
 * @param param0
 * @returns
 */
export function Chat({ ...props }: ChatProps) {
  const { send, chatMessages, isSending } = useChat();
  const handleSend = async () => {
    if (inputRef.current && inputRef.current.value.trim() !== '') {
      await send(inputRef.current.value);
      inputRef.current.value = '';
    }
  };
  const inputRef = React.useRef<HTMLInputElement>(null);
  return (
    <div {...props} className="lk-chat-container">
      <ul className="lk-chat-messages">
        {chatMessages.map((msg, idx) => (
          <li
            key={idx}
            title={new Date(msg.timestamp).toLocaleTimeString()}
            data-lk-local-message={!!msg.from?.isLocal}
          >
            {props.children ? (
              cloneSingleChild(props.children, { entry: msg })
            ) : (
              <ChatEntry entry={msg} />
            )}
          </li>
        ))}
      </ul>
      <input className="lk-chat-text-input" disabled={isSending} ref={inputRef} type="text"></input>
      <button className="lk-chat-send-button" disabled={isSending} onClick={handleSend}>
        Send
      </button>
    </div>
  );
}
