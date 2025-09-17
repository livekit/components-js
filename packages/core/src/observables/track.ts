import type {
  LocalTrackPublication,
  Participant,
  RemoteTrackPublication,
  Room,
  Track,
  TrackPublication,
} from 'livekit-client';
import { RoomEvent, TrackEvent } from 'livekit-client';
import { map, Observable, startWith } from 'rxjs';
import { allParticipantRoomEvents, participantTrackEvents } from '../helper';
import { log } from '../logger';
import type { TrackReference } from '../track-reference';
import { observeRoomEvents } from './room';
import type { ParticipantTrackIdentifier } from '../types';
import { observeParticipantEvents } from './participant';
// @ts-ignore some module resolutions (other than 'node') choke on this
import type { PublicationEventCallbacks } from 'livekit-client/dist/src/room/track/TrackPublication';

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
  const allParticipants = [localParticipant, ...Array.from(room.remoteParticipants.values())];
  const trackReferences: TrackReference[] = [];

  allParticipants.forEach((participant) => {
    sources.forEach((source) => {
      const sourceReferences = Array.from<RemoteTrackPublication | LocalTrackPublication>(
        participant.trackPublications.values(),
      )
        .filter(
          (track) =>
            track.source === source &&
            // either return all or only the ones that are subscribed
            (!onlySubscribedTracks || track.track),
        )
        .map((track): TrackReference => {
          return {
            participant: participant,
            publication: track,
            source: track.source,
          };
        });

      trackReferences.push(...sourceReferences);
    });
  });

  return { trackReferences, participants: allParticipants };
}

/**
 * Create `TrackReferences` for all tracks that are included in the sources property.
 *  */
function getParticipantTrackRefs(
  participant: Participant,
  identifier: ParticipantTrackIdentifier,
  onlySubscribedTracks = false,
): TrackReference[] {
  const { sources, kind, name } = identifier;
  const sourceReferences = Array.from(participant.trackPublications.values())
    .filter(
      (pub) =>
        (!sources || sources.includes(pub.source)) &&
        (!kind || pub.kind === kind) &&
        (!name || pub.trackName === name) &&
        // either return all or only the ones that are subscribed
        (!onlySubscribedTracks || pub.track),
    )
    .map((track): TrackReference => {
      return {
        participant: participant,
        publication: track,
        source: track.source,
      };
    });

  return sourceReferences;
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
      RoomEvent.ParticipantDisconnected,
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

export function participantTracksObservable(
  participant: Participant,
  trackIdentifier: ParticipantTrackIdentifier,
): Observable<TrackReference[]> {
  const observable = observeParticipantEvents(participant, ...participantTrackEvents).pipe(
    map((participant) => {
      const data = getParticipantTrackRefs(participant, trackIdentifier);
      log.debug(`TrackReference[] was updated. (length ${data.length})`, data);
      return data;
    }),
    startWith(getParticipantTrackRefs(participant, trackIdentifier)),
  );

  return observable;
}

export function trackEventSelector<T extends TrackEvent>(
  publication: TrackPublication | Track,
  event: T,
) {
  const observable = new Observable<
    Parameters<PublicationEventCallbacks[Extract<T, keyof PublicationEventCallbacks>]>
  >((subscribe) => {
    const update = (
      ...params: Parameters<PublicationEventCallbacks[Extract<T, keyof PublicationEventCallbacks>]>
    ) => {
      subscribe.next(params);
    };
    // @ts-expect-error not a perfect overlap between TrackEvent and keyof TrackEventCallbacks
    publication.on(event, update);

    const unsubscribe = () => {
      // @ts-expect-error not a perfect overlap between TrackEvent and keyof TrackEventCallbacks
      publication.off(event, update);
    };
    return unsubscribe;
  });

  return observable;
}

export function trackTranscriptionObserver(publication: TrackPublication) {
  return trackEventSelector(publication, TrackEvent.TranscriptionReceived);
}

export function trackSyncTimeObserver(track: Track) {
  return trackEventSelector(track, TrackEvent.TimeSyncUpdate).pipe(
    map(([timeUpdate]) => timeUpdate),
  );
}
