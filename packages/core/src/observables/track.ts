import {
  LocalTrackPublication,
  Participant,
  Room,
  RoomEvent,
  Track,
  TrackEvent,
  TrackPublication,
} from 'livekit-client';
import { Observable, startWith, Subscription } from 'rxjs';
import { allRemoteParticipantRoomEvents } from '../helper';
import log from '../logger';
import { TrackBundle } from '../types';
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
 * Create `TrackBundles` for all tracks that are included in the sources property.
 *  */
function getTrackBundles(
  room: Room,
  sources: Track.Source[],
  onlySubscribedTracks: boolean,
): { trackBundles: TrackBundle[]; participants: Participant[] } {
  const localParticipant = room.localParticipant;
  const allParticipants = [localParticipant, ...Array.from(room.participants.values())];
  const trackBundles: TrackBundle[] = [];

  allParticipants.forEach((participant) => {
    sources.forEach((source) => {
      const publication = participant.getTrack(source);
      if (publication) {
        if (publication.isSubscribed || publication instanceof LocalTrackPublication) {
          // Include subscribed `TrackPublications`.
          trackBundles.push({
            participant,
            publication,
            track: publication.track,
          });
        } else if (!onlySubscribedTracks) {
          // Include also `TrackPublications` that are not subscribed.
          trackBundles.push({ participant, publication });
        }
      }
    });
  });

  return { trackBundles, participants: allParticipants };
}

type TrackBundlesObservableOptions = {
  additionalRoomEvents?: RoomEvent[];
  onlySubscribed?: boolean;
};

export function trackBundlesObservable(
  room: Room,
  sources: Track.Source[],
  options: TrackBundlesObservableOptions,
): Observable<{ trackBundles: TrackBundle[]; participants: Participant[] }> {
  const additionalRoomEvents = options.additionalRoomEvents ?? allRemoteParticipantRoomEvents;
  const onlySubscribedTracks: boolean = options.onlySubscribed ?? true;
  const roomEventSubscriptions: Subscription[] = [];

  const observable = new Observable<{
    trackBundles: TrackBundle[];
    participants: Participant[];
  }>((subscribe) => {
    // Get and emit initial values.
    const initData = getTrackBundles(room, sources, onlySubscribedTracks);
    subscribe.next(initData);

    // Listen to room events related to track changes and emit new `TrackBundles`.
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
          const data = getTrackBundles(room, sources, onlySubscribedTracks);
          log.debug(
            `Because of RoomEvent: "${roomEvent}", TrackBundle[] was updated. (length ${data.trackBundles.length})`,
          );

          if (subscribe) {
            subscribe.next(data);
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
