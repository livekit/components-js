import type { Room } from 'livekit-client';
import { lkClassName } from '../utils';

export function setupDisconnectButton(room: Room) {
  const disconnect = (stopTracks?: boolean) => {
    room.disconnect(stopTracks);
  };
  const className: string = lkClassName('disconnect-button');
  return { className, disconnect };
}
