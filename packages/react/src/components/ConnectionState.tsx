import { connectionStateObserver } from '@livekit/components-core';
import type { Room } from 'livekit-client';
import React, { useEffect, useState } from 'react';
import { useRoomContext } from '../contexts';
import { useObservableState } from '../utils';

type ConnectionStatusProps = {
  room?: Room;
};

export function useConnectionState(room?: Room) {
  // passed room takes precedence, if not supplied get current room context
  const currentRoom = room ?? useRoomContext();

  const connectionState = useObservableState(
    connectionStateObserver(currentRoom),
    currentRoom.state,
    [currentRoom],
  );

  return connectionState;
}

export const ConnectionState = ({ room }: ConnectionStatusProps) => {
  const connectionState = useConnectionState(room);
  return <p>{connectionState}</p>;
};
