import { setupChat } from '@livekit/components-core';
import * as React from 'react';
import { useRoomContext } from '../contexts';
import { cloneSingleChild, useObservableState } from '../utils';
import { ChatEntry } from './ChatEntry';

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
 * The Chat component adds a basis chat functionality to the LiveKit room. The messages are distributed to all participants
 * in the room. Only users who are in the room at the time of dispatch will receive the message.
 *
 * @example
 * ```
 * import { Chat } from '@livekit/components-react';
 *
 * <LiveKitRoom>
 *   <Chat />
 * </LiveKitRoom>
 * ```
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
