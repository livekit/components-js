import { lkClassName } from '../utils';

export function setupParticipantTile() {
  const className: string = lkClassName('participant-view');
  return {
    className,
  };
}
