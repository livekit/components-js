import { type Track, TrackEvent } from 'livekit-client';
import { Observable } from 'rxjs';

export function observeTrack(track: Track) {
  const participantObserver = observeTrackEvents(
    track,
    TrackEvent.Muted,
    TrackEvent.Unmuted,
    TrackEvent.Subscribed,
    TrackEvent.Unsubscribed,
    TrackEvent.SubscriptionPermissionChanged,
  );

  return participantObserver;
}

export const observeTrackEvents = (track: Track, ...events: TrackEvent[]) => {
  const observable = new Observable<Track>((subscribe) => {
    const onTrackUpdate = () => {
      subscribe.next(track);
    };

    events.forEach((evt) => {
      track.on(evt, onTrackUpdate);
    });

    const unsubscribe = () => {
      events.forEach((evt) => {
        track.off(evt, onTrackUpdate);
      });
    };
    return unsubscribe;
  });

  return { subscribe: observable.subscribe };
};
