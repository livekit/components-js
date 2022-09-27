import { ClassNames } from '@livekit/components-styles/dist/types/styles.css';
import { getCSSClassName } from '../utils';

export function setupParticipantView() {
  const className: ClassNames = getCSSClassName('participant-view');
  return {
    className,
  };
}
