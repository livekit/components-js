import type { Room } from 'livekit-client';
import type { BaseSetupReturnType } from './types';

interface SetupDisconnectButton extends BaseSetupReturnType {
  /**
   * Calling this function will disconnect the user from the current room.
   */
  disconnect: () => void;
}

export function setupDisconnectButton(room: Room): SetupDisconnectButton {
  const disconnect = () => {
    room.disconnect();
  };

  return { className: 'lk-disconnect-button', disconnect }; // TODO: add class prefix back
}
