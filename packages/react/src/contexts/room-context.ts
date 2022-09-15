import { Room } from 'livekit-client';
import { createContext, useContext } from 'react';

const RoomContext = createContext<Room | undefined>(undefined);

function useRoomContext() {
  const ctx = useContext(RoomContext);
  if (!ctx) {
    throw Error('tried to access room context outside of livekit room component');
  }
  return ctx;
}

function useMaybeRoomContext() {
  return useContext(RoomContext);
}

export { RoomContext, useRoomContext, useMaybeRoomContext };
