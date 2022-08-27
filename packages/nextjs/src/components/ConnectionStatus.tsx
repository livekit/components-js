import { roomEventSelector } from '@livekit/auth-helpers-shared';
import { type Room, RoomEvent } from 'livekit-client';
import React, { useEffect, useState } from 'react';
import { useRoomContext } from './LiveKitRoom';

type ConnectionStatusProps = {
  room?: Room;
};

export function useConnectionState(room?: Room) {
  // passed room takes precedence, if not supplied get current room context
  const currentRoom = room ?? useRoomContext();
  const [connectionState, setConnectionState] = useState(currentRoom.state);
  useEffect(() => {
    const listener = roomEventSelector(currentRoom, RoomEvent.ConnectionStateChanged).subscribe(
      ([state]) => setConnectionState(state),
    );
    return () => listener.unsubscribe();
  });
  return connectionState;
}

export const ConnectionStatus = ({ room }: ConnectionStatusProps) => {
  const connectionState = useConnectionState(room);
  return <p>{connectionState}</p>;
};
