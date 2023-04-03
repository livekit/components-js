import type { Participant } from 'livekit-client';
import { createConnectionQualityObserver } from '../observables/participant';
import { prefixClass } from '../styles-interface';

export function setupConnectionQualityIndicator(participant: Participant) {
  const className = prefixClass('connection-quality');
  const connectionQualityObserver = createConnectionQualityObserver(participant);
  return { className, connectionQualityObserver };
}
