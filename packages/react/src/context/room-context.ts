import { type RoomSignalState } from '@livekit/components-core';
import * as React from 'react';

export type LiveKitRoomContext = {
  roomState: RoomSignalState;
};

/** @public */
export const RoomContext = React.createContext<LiveKitRoomContext | undefined>(undefined);

/**
 * Ensures that a room is provided via context.
 * If no room is provided, an error is thrown.
 * @public
 */
export function useRoomContext() {
  const ctx = React.useContext(RoomContext);
  if (!ctx) {
    throw Error('tried to access room context outside of livekit room component');
  }
  return ctx;
}

/**
 * Returns the room context if it exists, otherwise undefined.
 * @public
 */
export function useMaybeRoomContext() {
  return React.useContext(RoomContext);
}

/**
 * Ensures that a room is provided, either via context or explicitly as a parameter.
 * If no room is provided, an error is thrown.
 * @public
 */
export function useEnsureRoom(room?: RoomSignalState) {
  const context = useMaybeRoomContext();
  const r = room ?? context;
  if (!r) {
    throw new Error(
      'No room provided, make sure you are inside a Room context or pass the room explicitly',
    );
  }
  return r;
}
