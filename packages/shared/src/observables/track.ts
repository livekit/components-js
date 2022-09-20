import { TrackEvent, TrackPublication } from 'livekit-client';
import { Observable } from 'rxjs';

export function trackObservable(track: TrackPublication) {
  const trackObserver = observeTrackEvents(
    track,
    TrackEvent.Muted,
    TrackEvent.Unmuted,
    TrackEvent.Subscribed,
    TrackEvent.Unsubscribed,
    TrackEvent.SubscriptionPermissionChanged,
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
  });

  return observable;
};
