import { Participant, Room, RoomEvent, Track, TrackEvent, TrackPublication } from 'livekit-client';
import { map, Observable, startWith } from 'rxjs';
import { allParticipantRoomEvents } from '../helper';
import log from '../logger';
import { TrackReference } from '../track-reference';
import { observeRoomEvents } from './room';

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
 * Create `TrackReferences` for all tracks that are included in the sources property.
 *  */
function getTrackReferences(
  room: Room,
  sources: Track.Source[],
  onlySubscribedTracks = true,
): { trackReferences: TrackReference[]; participants: Participant[] } {
  const localParticipant = room.localParticipant;
  const allParticipants = [localParticipant, ...Array.from(room.participants.values())];
  const trackReferences: TrackReference[] = [];

  allParticipants.forEach((participant) => {
    sources.forEach((source) => {
      const publication = participant.getTrack(source);
      if (publication) {
        if (publication.track) {
          // Include subscribed `TrackPublications`.
          trackReferences.push({
            participant,
            publication,
            track: publication.track,
          });
        } else if (!onlySubscribedTracks) {
          // Include also `TrackPublications` that are not subscribed.
          trackReferences.push({ participant, publication });
        }
      }
      log.debug(
        `getting participant ${participant.identity}, source ${source}, exists: ${
          publication !== undefined
        }, subscribed: ${publication?.track !== undefined} `,
      );
    });
  });

  return { trackReferences, participants: allParticipants };
}

type TrackReferencesObservableOptions = {
  additionalRoomEvents?: RoomEvent[];
  onlySubscribed?: boolean;
};

export function trackReferencesObservable(
  room: Room,
  sources: Track.Source[],
  options: TrackReferencesObservableOptions,
): Observable<{ trackReferences: TrackReference[]; participants: Participant[] }> {
  const additionalRoomEvents = options.additionalRoomEvents ?? allParticipantRoomEvents;
  const onlySubscribedTracks: boolean = options.onlySubscribed ?? true;
  const roomEvents = Array.from(
    new Set([
      RoomEvent.ParticipantConnected,
      RoomEvent.ConnectionStateChanged,
      RoomEvent.LocalTrackPublished,
      RoomEvent.LocalTrackUnpublished,
      RoomEvent.TrackPublished,
      RoomEvent.TrackUnpublished,
      RoomEvent.TrackSubscriptionStatusChanged,
      ...additionalRoomEvents,
    ]).values(),
  );

  const observable = observeRoomEvents(room, ...roomEvents).pipe(
    map((room) => {
      const data = getTrackReferences(room, sources, onlySubscribedTracks);
      log.debug(`TrackReference[] was updated. (length ${data.trackReferences.length})`, data);
      return data;
    }),
    startWith(getTrackReferences(room, sources, onlySubscribedTracks)),
  );

  return observable;
}
