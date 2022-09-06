import { Participant, Track, TrackPublication } from 'livekit-client';
import { map, Observable, startWith } from 'rxjs';
import { observeParticipantMedia } from '../observables/participant';
import { BaseSetupReturnType } from './types';
// import { getCSSClassName } from '../utils';

const handleTrackAttachment = (
  publication: TrackPublication | undefined,
  element: HTMLMediaElement | null | undefined,
) => {
  if (!publication) return;
  const { isSubscribed, track } = publication;
  console.log('try attach', { isSubscribed, track, element });
  if (element && track) {
    if (isSubscribed) {
      track.attach(element);
    } else {
      track.detach(element);
    }
  }
};

type ParticipantMediaObserverType = Observable<{
  publication: TrackPublication | undefined;
}>;

function setupParticipantMediaObserver(
  participant: Participant,
  source: Track.Source,
  element?: HTMLMediaElement | null,
): ParticipantMediaObserverType {
  const initialPublication = participant.getTrack(source);
  handleTrackAttachment(initialPublication, element);

  return observeParticipantMedia(participant).pipe(
    map((p) => {
      const publication = p.getTrack(source);
      handleTrackAttachment(publication, element);
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
