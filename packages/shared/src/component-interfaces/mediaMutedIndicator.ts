import { ClassNames } from '@livekit/components-styles/dist/types/styles.css';
import { Participant, Track } from 'livekit-client';
import { mutedObservable } from '../observables/participant';

export function setupMediaMutedIndicator(participant: Participant, source: Track.Source) {
  // FIXME
  // @ts-ignore
  const className: ClassNames = `lk-media-muted-indicator-${source}`;
  const mediaMutedObserver = mutedObservable(participant, source);

  return { className, mediaMutedObserver };
}
