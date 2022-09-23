import { Participant, Track } from 'livekit-client';
import { mutedObserver } from '../observables/participant';

export function setupMediaMutedIndicator(participant: Participant, source: Track.Source) {
  const className = `lk-media-muted-indicator-${source}`;
  const mediaMutedObserver = mutedObserver(participant, source);

  return { className, mediaMutedObserver };
}
