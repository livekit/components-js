import { ClassNames } from '@livekit/components-styles/dist/types/general/styles.css';
import type { Room } from 'livekit-client';

export function setupDisconnectButton(room: Room) {
  const disconnect = (stopTracks?: boolean) => {
    room.disconnect(stopTracks);
  };
  const className: ClassNames = 'lk-disconnect-button';
  return { className, disconnect };
}
