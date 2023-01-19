import { Participant } from 'livekit-client';
import { createConnectionQualityObserver } from '../observables/participant';
import { lkClassName } from '../styles-interface';

export function setupConnectionQualityIndicator(participant: Participant) {
  const className = lkClassName('connection-quality');
  const connectionQualityObserver = createConnectionQualityObserver(participant);
  return { className, connectionQualityObserver };
}
