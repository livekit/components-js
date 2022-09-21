import {
  Participant,
  ParticipantEvent,
  RemoteParticipant,
  Room,
  RoomEvent,
  Track,
} from 'livekit-client';
import { ParticipantEventCallbacks } from 'livekit-client/dist/src/room/participant/Participant';
import { map, Observable, startWith, Subscriber } from 'rxjs';
import { observeRoomEvents } from './room';

export const observeParticipantEvents = (
  participant: Participant,
  ...events: ParticipantEvent[]
) => {
  const observable = new Observable<Participant>((subscribe) => {
    const onParticipantUpdate = () => {
      subscribe.next(participant);
    };

    events.forEach((evt) => {
      participant.on(evt, onParticipantUpdate);
    });

    const unsubscribe = () => {
      events.forEach((evt) => {
        participant.off(evt, onParticipantUpdate);
      });
    };
    return unsubscribe;
  });

  return observable;
};

export function observeParticipantMedia(participant: Participant) {
  const participantObserver = observeParticipantEvents(
    participant,
    ParticipantEvent.TrackMuted,
    ParticipantEvent.TrackUnmuted,
    ParticipantEvent.ParticipantPermissionsChanged,
    // ParticipantEvent.IsSpeakingChanged,
    ParticipantEvent.TrackPublished,
    ParticipantEvent.TrackUnpublished,
    ParticipantEvent.TrackSubscribed,
    ParticipantEvent.TrackUnsubscribed,
    ParticipantEvent.LocalTrackPublished,
    ParticipantEvent.LocalTrackUnpublished,
    // ParticipantEvent.ConnectionQualityChanged,
  ).pipe(startWith(participant));

  return participantObserver;
}

export function participantInfoObserver(participant: Participant) {
  const observer = observeParticipantEvents(
    participant,
    ParticipantEvent.ParticipantMetadataChanged,
  ).pipe(startWith(participant));
  return observer;
}

export function participantEventSelector<T extends ParticipantEvent>(
  participant: Participant,
  event: T,
) {
  const observable = new Observable<Parameters<ParticipantEventCallbacks[T]>>((subscribe) => {
    type Callback = ParticipantEventCallbacks[T];
    const update: Callback = (...params: Array<any>) => {
      // @ts-ignore
      subscribe.next(params);
    };
    participant.on(event, update);

    const unsubscribe = () => {
      participant.off(event, update);
    };
    return unsubscribe;
  });

  return observable;
}

export function mutedObserver(participant: Participant, source: Track.Source) {
  return observeParticipantEvents(
    participant,
    ParticipantEvent.TrackMuted,
    ParticipantEvent.TrackUnmuted,
  ).pipe(
    map((participant) => {
      const pub = participant.getTrack(source);
      return !!pub?.isMuted;
    }),
    startWith(!!participant.getTrack(source)?.isMuted),
  );
}

export function connectedParticipantsObserver(room: Room) {
  let subscriber: Subscriber<RemoteParticipant[]> | undefined;

  const observable = new Observable<RemoteParticipant[]>((sub) => {
    subscriber = sub;
    return () => listener.unsubscribe();
  }).pipe(startWith(Array.from(room.participants.values())));

  const listener = observeRoomEvents(
    room,
    RoomEvent.ParticipantConnected,
    RoomEvent.ParticipantDisconnected,
    RoomEvent.ConnectionStateChanged,
  ).subscribe((r) => subscriber?.next(Array.from(r.participants.values())));
  if (room.participants.size > 0) {
    subscriber?.next(Array.from(room.participants.values()));
  }
  return observable;
}
