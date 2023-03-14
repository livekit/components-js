import { connectedParticipantsObserver } from '@livekit/components-core';
import { RoomEvent, RemoteParticipant } from 'livekit-client';
import * as React from 'react';
import { useRoomContext } from '../context';

export interface UseRemoteParticipantsOptions {
  updateOnlyOn?: RoomEvent[];
}

/**
 * The useRemoteParticipants
 */
export const useRemoteParticipants = (options: UseRemoteParticipantsOptions = {}) => {
  const room = useRoomContext();
  const [participants, setParticipants] = React.useState<RemoteParticipant[]>([]);

  React.useEffect(() => {
    const listener = connectedParticipantsObserver(room, {
      additionalRoomEvents: options.updateOnlyOn,
    }).subscribe(setParticipants);
    return () => listener.unsubscribe();
  }, [room, JSON.stringify(options.updateOnlyOn)]);
  return participants;
};
