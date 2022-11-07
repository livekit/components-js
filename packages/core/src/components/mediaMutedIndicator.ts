import { Participant, Track } from 'livekit-client';
import { mutedObserver } from '../observables/participant';
import { lkClassName } from '../utils';

export function setupMediaMutedIndicator(participant: Participant, source: Track.Source) {
  // FIXME
  // @ts-ignore
  const className: string = lkClassName(`media-muted-indicator-${source}`);
  const mediaMutedObserver = mutedObserver(participant, source);

  return { className, mediaMutedObserver };
}
