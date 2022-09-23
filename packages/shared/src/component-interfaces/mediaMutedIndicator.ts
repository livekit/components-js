import { ClassNames } from '@livekit/components-styles/dist/types/styles.scss';
import { Participant, Track } from 'livekit-client';
import { mutedObserver } from '../observables/participant';

export function setupMediaMutedIndicator(participant: Participant, source: Track.Source) {
  // FIXME
  // @ts-ignore
  const className: ClassNames = `lk-media-muted-indicator-${source}`;
  const mediaMutedObserver = mutedObserver(participant, source);

  return { className, mediaMutedObserver };
}
