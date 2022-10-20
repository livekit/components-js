import { Participant, ParticipantEvent, TrackEvent, TrackPublication } from 'livekit-client';
import { map, Observable, startWith } from 'rxjs';
import { observeParticipantEvents } from './participant';

export function createPublicationsObservable(participant: Participant) {
  return observeParticipantEvents(
    participant,
    ParticipantEvent.TrackPublished,
    ParticipantEvent.TrackUnpublished,
  ).pipe(map((p) => p.getTracks()));
}

export function trackObservable(track: TrackPublication) {
  const trackObserver = observeTrackEvents(
    track,
    TrackEvent.Muted,
    TrackEvent.Unmuted,
    TrackEvent.Subscribed,
    TrackEvent.Unsubscribed,
  );

  return trackObserver;
}

export const observeTrackEvents = (track: TrackPublication, ...events: TrackEvent[]) => {
  const observable = new Observable<TrackPublication>((subscribe) => {
    const onTrackUpdate = () => {
      subscribe.next(track);
    };

    events.forEach((evt) => {
      // @ts-ignore
      track.on(evt, onTrackUpdate);
    });

    const unsubscribe = () => {
      events.forEach((evt) => {
        // @ts-ignore
        track.off(evt, onTrackUpdate);
      });
    };
    return unsubscribe;
  }).pipe(startWith(track));

  return observable;
};
