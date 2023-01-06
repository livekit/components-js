import { Participant, Track } from 'livekit-client';
import { map, startWith } from 'rxjs';
import { observeParticipantMedia } from '../observables/participant';
import { lkClassName } from '../utils';

export function setupMediaTrack(participant: Participant, source: Track.Source) {
  const trackObserver = observeParticipantMedia(participant).pipe(
    map((media) => {
      const publication = media.participant.getTrack(source);
      // attachIfSubscribed(publication, element);
      return publication;
    }),
    startWith(participant.getTrack(source)),
  );
  const className: string = lkClassName(
    source === Track.Source.Camera || source === Track.Source.ScreenShare
      ? 'participant-media-video'
      : 'participant-media-audio',
  );
  return { className, trackObserver };
}
