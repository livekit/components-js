import { connectionStateObserver } from '@livekit/components-core';
import type { Room } from 'livekit-client';
import React, { useEffect, useState } from 'react';
import { useRoomContext } from '../contexts';

type ConnectionStatusProps = {
  room?: Room;
};

export function useConnectionState(room?: Room) {
  // passed room takes precedence, if not supplied get current room context
  const currentRoom = room ?? useRoomContext();
  const [connectionState, setConnectionState] = useState(currentRoom.state);

  useEffect(() => {
    const listener = connectionStateObserver(currentRoom).subscribe(([state]) =>
      setConnectionState(state),
    );
    return () => listener.unsubscribe();
  });

  return connectionState;
}

export const ConnectionState = ({ room }: ConnectionStatusProps) => {
  const connectionState = useConnectionState(room);
  return <p>{connectionState}</p>;
};
