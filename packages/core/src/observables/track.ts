import { Participant, Room, RoomEvent, Track, TrackEvent, TrackPublication } from 'livekit-client';
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

  function handleSub(sources: Track.Source[], publication: TrackPublication, ...args: any[]) {
    if (!sources.includes(publication.source)) {
      return;
    }

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

    trackParticipantPairSubscriber.next(initTrackParticipantPairs);
  }

  // Listen to room events related to track changes and call the handler function.
  roomEventSubscriptions.push(
    roomEventSelector(room, RoomEvent.TrackSubscribed).subscribe(([_, ...args]) => {
      handleSub(sources, ...args);
    }),
  );
  roomEventSubscriptions.push(
    roomEventSelector(room, RoomEvent.TrackUnsubscribed).subscribe(([_, ...args]) =>
      handleSub(sources, ...args),
    ),
  );
  roomEventSubscriptions.push(
    roomEventSelector(room, RoomEvent.LocalTrackPublished).subscribe((args) =>
      handleSub(sources, ...args),
    ),
  );
  roomEventSubscriptions.push(
    roomEventSelector(room, RoomEvent.LocalTrackUnpublished).subscribe((args) => {
      handleSub(sources, ...args);
    }),
  );
  roomEventSubscriptions.push(
    roomEventSelector(room, RoomEvent.TrackMuted).subscribe((args) => {
      handleSub(sources, ...args);
    }),
  );
  roomEventSubscriptions.push(
    roomEventSelector(room, RoomEvent.TrackUnmuted).subscribe((args) => {
      handleSub(sources, ...args);
    }),
  );
  // setTimeout(() => {
  //   // TODO find way to avoid this timeout
  //   for (const p of room.participants.values()) {
  //     p.getTracks().forEach((track) => {
  //       handleSub(sources, 'set', track, p);
  //     });
  //   }
  // }, 1);

  return observable;
}
