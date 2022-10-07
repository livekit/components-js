/* eslint-disable camelcase */
import { DataPacket_Kind, Participant, RemoteParticipant, Room, RoomEvent } from 'livekit-client';
import React, { HTMLAttributes, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRoomContext } from '../contexts';

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

  const onDataReceived = useCallback((payload: Uint8Array, participant?: RemoteParticipant) => {
    const dataMsg = JSON.parse(decoder.decode(payload)) as DataMessageUnion;
    if (dataMsg.type === MessageType.CHAT) {
      const { timestamp, message } = dataMsg;
      setChatMessages([...chatMessages, { timestamp, message, from: participant }]);
    }
  }, []);

  useEffect(() => {
    currentRoom.on(RoomEvent.DataReceived, onDataReceived);
    return () => {
      currentRoom.off(RoomEvent.DataReceived, onDataReceived);
    };
  }, [currentRoom]);

  const send = async (message: string) => {
    const timestamp = Date.now();
    const chatMsg: ChatDataMessage = {
      type: MessageType.CHAT,
      timestamp,
      message: message,
    };
    const dataMsg = encoder.encode(JSON.stringify(chatMsg));
    await currentRoom.localParticipant.publishData(dataMsg, DataPacket_Kind.RELIABLE);
    setChatMessages([...chatMessages, { message, timestamp, from: currentRoom.localParticipant }]);
  };

  return { send, chatMessages };
}

export function Chat({ room, ...props }: ChatProps) {
  const { send, chatMessages } = useChat(room);
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
        {chatMessages.map((msg) => (
          <li
            key={msg.timestamp + (msg.from?.identity ?? '')}
            title={new Date(msg.timestamp).toLocaleTimeString()}
          >
            <em>{msg.from?.name ?? msg.from?.identity}</em>: {msg.message}
          </li>
        ))}
      </ul>
      <input ref={inputRef} type="text"></input>
      <button onClick={handleSend}>Send</button>
    </div>
  );
}
