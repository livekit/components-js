import { Participant, Track, TrackPublication } from 'livekit-client';
import { map, Observable, startWith } from 'rxjs';
import { observeParticipantMedia } from '../observables/participant';
import { attachIfSubscribed } from '../utils';
import { BaseSetupReturnType } from './types';
// import { getCSSClassName } from '../utils';

type ParticipantMediaObserverType = Observable<{
  publication: TrackPublication | undefined;
}>;

function setupParticipantMediaObserver(
  participant: Participant,
  source: Track.Source,
  element?: HTMLMediaElement | null,
): ParticipantMediaObserverType {
  const initialPublication = participant.getTrack(source);

  return observeParticipantMedia(participant).pipe(
    map((media) => {
      const publication = media.participant.getTrack(source);
      attachIfSubscribed(publication, element);
      return { publication };
    }),
    startWith({ publication: initialPublication }),
  );
}

const observers = {
  setupParticipantMediaObserver,
};

function setup(source: Track.Source): BaseSetupReturnType {
  return {
    className:
      source === Track.Source.Camera ? 'lk-participant-media-camera' : 'lk-participant-media-audio',
  };
}

export { setup, observers };
