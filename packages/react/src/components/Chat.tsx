import { ChatMessage, setupChat } from '@livekit/components-core';
import { Room } from 'livekit-client';
import React, { HTMLAttributes, useMemo, useRef } from 'react';
import { useRoomContext } from '../contexts';
import { cloneSingleChild, useObservableState } from '../utils';

export interface ChatProps extends HTMLAttributes<HTMLDivElement> {
  room?: Room;
}

export function useChat(room?: Room) {
  const currentRoom = room ?? useRoomContext();
  const { isSendingObservable, messageObservable, send } = useMemo(
    () => setupChat(currentRoom),
    [currentRoom],
  );
  const isSending = useObservableState(isSendingObservable, false);
  const chatMessages = useObservableState(messageObservable, []);
  return { send, chatMessages, isSending };
}

export interface ChatEntryProps extends HTMLAttributes<HTMLDivElement> {
  entry: ChatMessage;
}
export function ChatEntry({ entry, ...props }: ChatEntryProps) {
  return (
    <div {...props}>
      <em>{entry.from?.name ?? entry.from?.identity}</em>: {entry.message}
    </div>
  );
}

export function Chat({ room, ...props }: ChatProps) {
  const { send, chatMessages, isSending } = useChat(room);
  const handleSend = async () => {
    if (inputRef.current && inputRef.current.value.trim() !== '') {
      await send(inputRef.current.value);
      inputRef.current.value = '';
    }
  };
  const inputRef = useRef<HTMLInputElement>(null);
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
