import type { Room, RoomEvent } from 'livekit-client';
import { useLocalParticipant } from './useLocalParticipant';
import { useRemoteParticipants } from './useRemoteParticipants';

/** @public */
export interface UseParticipantsOptions {
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
 * The useParticipants hook returns all participants (local and remote) of the current room.
 * @public
 */
export const useParticipants = (options: UseParticipantsOptions = {}) => {
  const remoteParticipants = useRemoteParticipants(options);
  const { localParticipant } = useLocalParticipant(options);

  return [localParticipant, ...remoteParticipants];
};
