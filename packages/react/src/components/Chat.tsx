/* eslint-disable camelcase */
import { DataPacket_Kind, Participant, RemoteParticipant, Room, RoomEvent } from 'livekit-client';
import React, {
  Children,
  HTMLAttributes,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRoomContext } from '../contexts';
import { cloneSingleChild } from '../utils';

export interface ChatProps extends HTMLAttributes<HTMLDivElement> {
  room?: Room;
}

export const enum MessageType {
  CHAT,
}

export interface BaseDataMessage {
  type: MessageType;
}

export interface ChatDataMessage extends BaseDataMessage {
  type: MessageType.CHAT;
  timestamp: number;
  message: string;
}

type DataMessageUnion = ChatDataMessage;

export interface ChatMessage {
  timestamp: number;
  message: string;
  from?: Participant;
}

export function useChat(room?: Room) {
  const decoder = useMemo(() => new TextDecoder(), []);
  const encoder = useMemo(() => new TextEncoder(), []);

  const currentRoom = room ?? useRoomContext();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState<boolean>(false);

  const onDataReceived = useCallback((payload: Uint8Array, participant?: RemoteParticipant) => {
    const dataMsg = JSON.parse(decoder.decode(payload)) as DataMessageUnion;
    if (dataMsg.type === MessageType.CHAT) {
      const { timestamp, message } = dataMsg;
      setChatMessages((prevMessages) => [
        ...prevMessages,
        { timestamp, message, from: participant },
      ]);
    }
  }, []);

  useEffect(() => {
    currentRoom.on(RoomEvent.DataReceived, onDataReceived);
    return () => {
      currentRoom.off(RoomEvent.DataReceived, onDataReceived);
    };
  }, [currentRoom]);

  const send = useCallback(
    async (message: string) => {
      const timestamp = Date.now();
      const chatMsg: ChatDataMessage = {
        type: MessageType.CHAT,
        timestamp,
        message: message,
      };
      setIsSending(true);
      try {
        const dataMsg = encoder.encode(JSON.stringify(chatMsg));
        await currentRoom.localParticipant.publishData(dataMsg, DataPacket_Kind.RELIABLE);
        setChatMessages((prevMessages) => [
          ...prevMessages,
          { message, timestamp, from: currentRoom.localParticipant },
        ]);
      } finally {
        setIsSending(false);
      }
    },
    [currentRoom],
  );

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
    <div {...props}>
      <ul>
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
      <input disabled={isSending} ref={inputRef} type="text"></input>
      <button disabled={isSending} onClick={handleSend}>
        Send
      </button>
    </div>
  );
}
