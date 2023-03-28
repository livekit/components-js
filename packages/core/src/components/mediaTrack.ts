import { Track } from 'livekit-client';
import { map, startWith } from 'rxjs';
import { observeParticipantMedia } from '../observables/participant';
import { prefixClass } from '../styles-interface';
import { isTrackReference } from '../track-reference/track-reference.types';
import { TrackIdentifier } from '../types';

export function setupMediaTrack(trackIdentifier: TrackIdentifier) {
  const initialPub = getTrackByIdentifier(trackIdentifier);
  const trackObserver = observeParticipantMedia(trackIdentifier.participant).pipe(
    map(() => {
      return getTrackByIdentifier(trackIdentifier);
    }),
    startWith(initialPub),
  );
  const className: string = prefixClass(
    initialPub?.source === Track.Source.Camera || initialPub?.source === Track.Source.ScreenShare
      ? 'participant-media-video'
      : 'participant-media-audio',
  );
  return { className, trackObserver };
}

export function getTrackByIdentifier(options: TrackIdentifier) {
  if (isTrackReference(options)) {
    return options.publication;
  } else {
    const { source, name, participant } = options;
    if (source && name) {
      return participant.getTracks().find((pub) => pub.source === source && pub.trackName === name);
    } else if (name) {
      return participant.getTrackByName(name);
    } else if (source) {
      return participant.getTrack(source);
    } else {
      throw new Error('At least one of source and name needs to be defined');
    }
  }
}
