import { connectionStateObserver } from '@livekit/components-core';
import { type Room, ConnectionState } from 'livekit-client';
import React, { useEffect, useState } from 'react';
import { useRoomContext } from './LiveKitRoom';

type ConnectionStatusProps = {
  room?: Room;
};

export function useConnectionState(room?: Room): ConnectionState {
  // passed room takes precedence, if not supplied get current room context
  const currentRoom = room ?? useRoomContext();
  const [connectionState, setConnectionState] = useState<ConnectionState>(currentRoom.state);

  useEffect(() => {
    const listener = connectionStateObserver(currentRoom, setConnectionState);
    return () => listener.unsubscribe();
  });

  return connectionState;
}

export const ConnectionStatus = ({ room }: ConnectionStatusProps) => {
  const connectionState = useConnectionState(room);
  return <p>{connectionState}</p>;
};
