import { prefixClass } from '../styles-interface';

export function setupParticipantTile() {
  const className: string = prefixClass('participant-tile');
  return {
    className,
  };
}
