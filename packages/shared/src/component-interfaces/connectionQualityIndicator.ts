import { Participant } from 'livekit-client';
import { createConnectionQualityObserver } from '../observables/participant';
import { ClassNames } from '@livekit/components-styles/dist/types/styles.scss';

export function setupConnectionQualityIndicator(participant: Participant) {
  const className: ClassNames = 'lk-connection-quality';
  const connectionQualityObserver = createConnectionQualityObserver(participant);
  return { className, connectionQualityObserver };
}
