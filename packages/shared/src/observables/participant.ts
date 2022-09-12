import { Participant, ParticipantEvent, RemoteParticipant, Room, RoomEvent } from 'livekit-client';
import { ParticipantEventCallbacks } from 'livekit-client/dist/src/room/participant/Participant';
import { Observable } from 'rxjs';
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
    ParticipantEvent.IsSpeakingChanged,
    ParticipantEvent.TrackPublished,
    ParticipantEvent.TrackUnpublished,
    ParticipantEvent.TrackSubscribed,
    ParticipantEvent.TrackUnsubscribed,
    ParticipantEvent.LocalTrackPublished,
    ParticipantEvent.LocalTrackUnpublished,
    ParticipantEvent.ConnectionQualityChanged,
  );

  return participantObserver;
}

export function participantInfoObserver(
  participant: Participant,
  onInfoChange: (p: Participant) => void,
) {
  const observer = observeParticipantEvents(
    participant,
    ParticipantEvent.ParticipantMetadataChanged,
  ).subscribe(onInfoChange);
  onInfoChange(participant);
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

export function connectedParticipants(
  room: Room,
  onConnectedParticipantsChanged: (participants: RemoteParticipant[]) => void,
) {
  const listener = observeRoomEvents(
    room,
    RoomEvent.ParticipantConnected,
    RoomEvent.ParticipantDisconnected,
    RoomEvent.ConnectionStateChanged,
  ).subscribe((r) => onConnectedParticipantsChanged(Array.from(r.participants.values())));
  if (room.participants.size > 0) {
    onConnectedParticipantsChanged(Array.from(room.participants.values()));
  }
  return () => listener.unsubscribe();
}
