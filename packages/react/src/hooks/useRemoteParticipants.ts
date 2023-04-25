import { connectedParticipantsObserver } from '@livekit/components-core';
import type { RoomEvent, RemoteParticipant, Room } from 'livekit-client';
import * as React from 'react';
import { useEnsureRoom } from '../context';

/** @public */
export interface UseRemoteParticipantsOptions {
  /**
   * To optimize performance, you can use the `updateOnlyOn` property to decide on what RoomEvents the hook updates.
   * By default it updates on all relevant RoomEvents to keep the returned participants array up to date.
   * The minimal set of non-overwriteable `RoomEvents` is: `[RoomEvent.ParticipantConnected, RoomEvent.ParticipantDisconnected, RoomEvent.ConnectionStateChanged]`
   */
  updateOnlyOn?: RoomEvent[];
  /**
   * The room to use. If not provided, the hook will use the room from the context.
   */
  room?: Room;
}

/**
 * The useRemoteParticipants
 *
 * @public
 */
export const useRemoteParticipants = (options: UseRemoteParticipantsOptions = {}) => {
  const room = useEnsureRoom(options.room);
  const [participants, setParticipants] = React.useState<RemoteParticipant[]>([]);

  React.useEffect(() => {
    const listener = connectedParticipantsObserver(room, {
      additionalRoomEvents: options.updateOnlyOn,
    }).subscribe(setParticipants);
    return () => listener.unsubscribe();
  }, [room, JSON.stringify(options.updateOnlyOn)]);
  return participants;
};
