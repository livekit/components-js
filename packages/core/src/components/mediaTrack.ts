import { Participant, Track } from 'livekit-client';
import { map, startWith } from 'rxjs';
import { observeParticipantMedia } from '../observables/participant';
import { prefixClass } from '../styles-interface';
import { TrackObserverOptions } from '../types';

export function setupMediaTrack(participant: Participant, { source, name }: TrackObserverOptions) {
  const trackObserver = observeParticipantMedia(participant).pipe(
    map((media) => {
      const publication = source
        ? media.participant.getTrack(source)
        : media.participant.getTrackByName(name);
      // attachIfSubscribed(publication, element);
      return publication;
    }),
    startWith(source ? participant.getTrack(source) : participant.getTrackByName(name)),
  );
  const className: string = prefixClass(
    source === Track.Source.Camera || source === Track.Source.ScreenShare
      ? 'participant-media-video'
      : 'participant-media-audio',
  );
  return { className, trackObserver };
}
