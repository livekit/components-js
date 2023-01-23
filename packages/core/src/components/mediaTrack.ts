import { Participant, Track } from 'livekit-client';
import Observable from 'zen-observable';
import { observeParticipantMedia } from '../observables/participant';
import { prefixClass } from '../styles-interface';

export function setupMediaTrack(participant: Participant, source: Track.Source) {
  const trackObserver = Observable.of(participant.getTrack(source)).concat(
    observeParticipantMedia(participant).map((media) => {
      const publication = media.participant.getTrack(source);
      // attachIfSubscribed(publication, element);
      return publication;
    }),
  );
  const className: string = prefixClass(
    source === Track.Source.Camera || source === Track.Source.ScreenShare
      ? 'participant-media-video'
      : 'participant-media-audio',
  );
  return { className, trackObserver };
}
