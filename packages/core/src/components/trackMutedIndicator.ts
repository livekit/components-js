import type { Styles } from '@livekit/components-styles/dist/types_unprefixed/styles.scss';
import type { Participant } from 'livekit-client';
import { Track } from 'livekit-client';
import { mutedObserver } from '../observables/participant';
import { prefixClass } from '../styles-interface';

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
  const className: string = prefixClass(classForSource);
  const mediaMutedObserver = mutedObserver(participant, source);

  return { className, mediaMutedObserver };
}
