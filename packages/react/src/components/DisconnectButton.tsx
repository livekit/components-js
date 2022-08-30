import { ConnectionState, type Room } from 'livekit-client';
import React, { useEffect, useState } from 'react';
import { DisconnectButtonInterface } from '@livekit/components-core';
import { useRoomContext } from './LiveKitRoom';

type DisconnectButtonProps = {
  room?: Room;
  text?: string;
};

function useConnectionState(room?: Room): [ConnectionState, Room] {
  // passed room takes precedence, if not supplied get current room context
  const currentRoom = room ?? useRoomContext();
  const [connectionState, setConnectionState] = useState<ConnectionState>(currentRoom.state);

  useEffect(() => {
    const listener = DisconnectButtonInterface.connectionStateObserver(currentRoom).subscribe(
      ([state]) => setConnectionState(state),
    );
    return () => listener.unsubscribe();
  });
  return [connectionState, currentRoom];
}

export const DisconnectButton = ({ room, text }: DisconnectButtonProps) => {
  const [connectionState, currentRoom] = useConnectionState(room);

  const handleClick = (): void => {
    console.debug('Disconnect button was clicked: ');
    currentRoom?.disconnect();
  };

  return (
    <button
      className="lk-disconnect-button"
      onClick={handleClick}
      disabled={connectionState === ConnectionState.Disconnected}
    >
      {text || 'Disconnect'}
    </button>
  );
};
