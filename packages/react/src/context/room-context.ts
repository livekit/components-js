import type { Room } from 'livekit-client';
import React from 'react';

export const RoomContext = React.createContext<Room | undefined>(undefined);

export function useRoomContext() {
  const ctx = React.useContext(RoomContext);
  if (!ctx) {
    throw Error('tried to access room context outside of livekit room component');
  }
  return ctx;
}

export function useMaybeRoomContext() {
  return React.useContext(RoomContext);
}

export function useEnsureRoom(room?: Room) {
  const context = useMaybeRoomContext();
  const r = room ?? context;
  if (!r) {
    throw new Error(
      'No room provided, make sure you are inside a Room context or pass the room explicitly',
    );
  }
  return r;
}
