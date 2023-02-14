import {
  LocalTrackPublication,
  Room,
  RoomEvent,
  Track,
  TrackEvent,
  TrackPublication,
} from 'livekit-client';
import { Observable, startWith, Subscription } from 'rxjs';
import { allRemoteParticipantRoomEvents } from '../helper';
import log from '../logger';
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
      // @ts-expect-error type of `TrackEvent` and `PublicationCallbacks` are congruent
      track.on(evt, onTrackUpdate);
    });

    const unsubscribe = () => {
      events.forEach((evt) => {
        // @ts-expect-error type of `TrackEvent` and `PublicationCallbacks` are congruent
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
  const pairs: TrackParticipantPair[] = [];

  allParticipants.forEach((participant) => {
    sources.forEach((source) => {
      const track = participant.getTrack(source);
      if (track && (track instanceof LocalTrackPublication || track?.isDesired)) {
        pairs.push({ track: track, participant: participant });
      }
    });
  });

  return pairs;
}

type TrackParticipantPairsObservableOptions = {
  additionalRoomEvents?: RoomEvent[];
};

export function trackParticipantPairsObservable(
  room: Room,
  sources: Track.Source[],
  options: TrackParticipantPairsObservableOptions,
): Observable<TrackParticipantPair[]> {
  const roomEventSubscriptions: Subscription[] = [];

  const observable = new Observable<TrackParticipantPair[]>((subscribe) => {
    // Get and emit initial values.
    const initPairs = getTrackParticipantPairs(room, sources);
    subscribe.next(initPairs);

    const additionalRoomEvents = options.additionalRoomEvents ?? allRemoteParticipantRoomEvents;
    // Listen to room events related to track changes and emit new pairs.
    const roomEventsToListenFor = Array.from(
      new Set([
        RoomEvent.LocalTrackPublished,
        RoomEvent.LocalTrackUnpublished,
        RoomEvent.TrackSubscriptionStatusChanged,
        ...additionalRoomEvents,
      ]),
    );
    roomEventsToListenFor.forEach((roomEvent) => {
      roomEventSubscriptions.push(
        roomEventSelector(room, roomEvent).subscribe(() => {
          const pairs = getTrackParticipantPairs(room, sources);
          log.debug(`Trigger observer update by \nRoomEvent: ${roomEvent}\nPairs: ${pairs.length}`);

          if (subscribe) {
            subscribe.next(pairs);
          }
        }),
      );
    });

    /** Observable cleanup. */
    return () => {
      roomEventSubscriptions.forEach((roomEventSubscription) =>
        roomEventSubscription.unsubscribe(),
      );
    };
  });

  return observable;
}
