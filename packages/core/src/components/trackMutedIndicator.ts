import { Styles } from '@livekit/components-styles/dist/types_unprefixed/styles.scss';
import { Participant, Track } from 'livekit-client';
import { mutedObserver } from '../observables/participant';
import { lkClassName } from '../utils';

export function setupTrackMutedIndicator(participant: Participant, source: Track.Source) {
  let classForSource: keyof Styles = 'track-muted-indicator-camera';
  switch (source) {
    case Track.Source.Camera:
      classForSource = 'track-muted-indicator-camera';
      break;
    case Track.Source.Microphone:
      classForSource = 'track-muted-indicator-microphone';
      break;

    default:
      break;
  }
  const className: string = lkClassName(classForSource);
  const mediaMutedObserver = mutedObserver(participant, source);

  return { className, mediaMutedObserver };
}
