import type { Room } from 'livekit-client';
import { getCSSClassName } from '../utils';

export function setupDisconnectButton(room: Room) {
  const disconnect = () => {
    room.disconnect();
  };
  return { className: getCSSClassName('button---disconnect'), disconnect };
}
