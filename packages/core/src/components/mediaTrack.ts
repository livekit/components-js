import { Participant, Track } from 'livekit-client';
import { observeParticipantMedia } from '../observables/participant';
import { observableWithDefault } from '../observables/utils';
import { prefixClass } from '../styles-interface';

export function setupMediaTrack(participant: Participant, source: Track.Source) {
  const trackObserver = observableWithDefault(
    observeParticipantMedia(participant).map((media) => {
      const publication = media.participant.getTrack(source);
      // attachIfSubscribed(publication, element);
      return publication;
    }),
    participant.getTrack(source),
  );
  const className: string = prefixClass(
    source === Track.Source.Camera || source === Track.Source.ScreenShare
      ? 'participant-media-video'
      : 'participant-media-audio',
  );
  return { className, trackObserver };
}
