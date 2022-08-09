import React, { ReactNode, useCallback, useContext, useEffect, useState } from 'react';
// import { useParticipant as useParticipantHook } from '@livekit/react-core';
import { ConnectionState, Room, RoomEvent } from 'livekit-client';

type RoomProviderProps = {
  children: Array<ReactNode> | ReactNode;
};

type RoomContextState = {
  room: Room;
  connectionState: ConnectionState;
};

const RoomContext = React.createContext<RoomContextState>({
  room: new Room(),
  connectionState: ConnectionState.Disconnected,
});

export function useRoom() {
  return useContext(RoomContext);
}

export function useToken(identity: string, roomName: string) {
  const [token, setToken] = useState<string | undefined>(undefined);
  useCallback(async () => {
    const res = await fetch(`/api/livekit/token?roomName=${roomName}&identity=${identity}`);
    const { accessToken } = await res.json();
    setToken(accessToken);
  }, [identity, roomName]);
  return token;
}

// export function useParticipants() {
//   return useContext(RoomContext)?.participants;
// }

// export function useParticipant(identity: string) {
//   const participant = useContext(RoomContext).getParticipantByIdentity(identity);
//   return participant ? useParticipantHook(participant) : undefined;
// }

export const RoomProvider = ({ children }: RoomProviderProps) => {
  const [room] = useState<Room>(new Room());
  const [roomState, setRoomState] = useState<RoomContextState>({
    room: room,
    connectionState: ConnectionState.Disconnected,
  });

  const handleRoomUpdate = () => {
    setRoomState({ room: room, connectionState: room.state });
  };
  useEffect(() => {
    room.on(RoomEvent.ParticipantConnected, handleRoomUpdate);
    room.on(RoomEvent.ParticipantDisconnected, handleRoomUpdate);
    room.on(RoomEvent.RoomMetadataChanged, handleRoomUpdate);
    room.on(RoomEvent.ConnectionStateChanged, handleRoomUpdate);
  });
  console.log('rendering room provider');
  return <RoomContext.Provider value={roomState}>{children}</RoomContext.Provider>;
};
