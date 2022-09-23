import { ClassNames } from '@livekit/components-styles/dist/types/styles.scss';
import { Participant, Track } from 'livekit-client';
import { map } from 'rxjs';
import { observeParticipantMedia } from '../observables/participant';
import { attachIfSubscribed } from '../utils';

export function setupMediaTrack(participant: Participant, source: Track.Source) {
  const trackObserver = observeParticipantMedia(participant).pipe(
    map((media) => {
      const publication = media.participant.getTrack(source);
      // attachIfSubscribed(publication, element);
      return publication;
    }),
  );
  const className: ClassNames =
    source === Track.Source.Camera ? 'lk-participant-media-camera' : 'lk-participant-media-audio';
  return { className, trackObserver };
}
