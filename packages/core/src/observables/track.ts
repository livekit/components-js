import { Room, RoomEvent, Track, TrackEvent, TrackPublication } from 'livekit-client';
import { Observable, startWith, Subscriber, Subscription } from 'rxjs';
import { TrackParticipantPair } from '../types';
import { roomEventSelector } from './room';

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

export function observeTrackEvents(track: TrackPublication, ...events: TrackEvent[]) {
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
}

/**
 * Create `TrackParticipantPairs` for all tracks that are included in the sources property.
 *  */
function getTrackParticipantPairs(room: Room, sources: Track.Source[]): TrackParticipantPair[] {
  const localParticipant = room.localParticipant;
  const allParticipants = [localParticipant, ...Array.from(room.participants.values())];
  const initTrackParticipantPairs: TrackParticipantPair[] = [];

  allParticipants.forEach((p) => {
    sources.forEach((source) => {
      const track = p.getTrack(source);
      if (track) {
        initTrackParticipantPairs.push({ track: track, participant: p });
      }
    });
  });

  return initTrackParticipantPairs;
}

export function trackParticipantPairsObservable(
  room: Room,
  sources: Track.Source[],
): Observable<TrackParticipantPair[]> {
  let trackParticipantPairSubscriber: Subscriber<TrackParticipantPair[]>;
  const roomEventSubscriptions: Subscription[] = [];

  const observable = new Observable<TrackParticipantPair[]>((subscribe) => {
    trackParticipantPairSubscriber = subscribe;
    return () => {
      roomEventSubscriptions.forEach((roomEventSubscription) =>
        roomEventSubscription.unsubscribe(),
      );
    };
  });

  const roomEventsToListenFor = [
    RoomEvent.TrackSubscribed,
    RoomEvent.TrackUnsubscribed,
    RoomEvent.LocalTrackPublished,
    RoomEvent.LocalTrackUnpublished,
    RoomEvent.TrackMuted,
    RoomEvent.TrackUnmuted,
  ];

  // Listen to room events related to track changes and call the handler function.
  roomEventsToListenFor.forEach((roomEvent) => {
    roomEventSelector(room, roomEvent).subscribe(() => {
      const pairs = getTrackParticipantPairs(room, sources);
      trackParticipantPairSubscriber.next(pairs);
    });
  });

  setTimeout(() => {
    getTrackParticipantPairs(room, sources);
  }, 1);

  return observable;
}
