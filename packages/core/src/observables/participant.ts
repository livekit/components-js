import {
  Participant,
  ParticipantEvent,
  RemoteParticipant,
  Room,
  RoomEvent,
  Track,
  TrackPublication,
} from 'livekit-client';
import { map, Observable, startWith, Subscriber } from 'rxjs';
import { observeRoomEvents } from './room';
import { ParticipantEventCallbacks } from 'livekit-client/dist/src/room/participant/Participant';

export function observeParticipantEvents<T extends Participant>(
  participant: T,
  ...events: ParticipantEvent[]
) {
  const observable = new Observable<T>((subscribe) => {
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
  }).pipe(startWith(participant));

  return observable;
}

export interface ParticipantMedia<T extends Participant = Participant> {
  isCameraEnabled: boolean;
  isMicrophoneEnabled: boolean;
  isScreenShareEnabled: boolean;
  microphoneTrack?: TrackPublication;
  cameraTrack?: TrackPublication;
  participant: T;
}

export function observeParticipantMedia<T extends Participant>(participant: T) {
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
  ).pipe(
    map((p) => {
      const { isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } = p;
      const microphoneTrack = p.getTrack(Track.Source.Microphone);
      const cameraTrack = p.getTrack(Track.Source.Camera);
      const participantMedia: ParticipantMedia<T> = {
        isCameraEnabled,
        isMicrophoneEnabled,
        isScreenShareEnabled,
        cameraTrack,
        microphoneTrack,
        participant: p,
      };
      return participantMedia;
    }),
  );

  return participantObserver;
}

export function createTrackObserver(participant: Participant, source: Track.Source) {
  return observeParticipantMedia(participant).pipe(
    map((media) => {
      const publication = media.participant.getTrack(source);
      return { publication };
    }),
  );
}

export function participantInfoObserver(participant: Participant) {
  const observer = observeParticipantEvents(
    participant,
    ParticipantEvent.ParticipantMetadataChanged,
    // ParticipantEvent.LocalTrackPublished,
  ).pipe(
    map(({ name, identity, metadata }) => {
      return {
        name,
        identity,
        metadata,
      };
    }),
    startWith({
      name: participant.name,
      identity: participant.identity,
      metadata: participant.metadata,
    }),
  );
  return observer;
}

export function createConnectionQualityObserver(participant: Participant) {
  const observer = participantEventSelector(
    participant,
    ParticipantEvent.ConnectionQualityChanged,
  ).pipe(
    map(([quality]) => quality),
    startWith(participant.connectionQuality),
  );
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
    ParticipantEvent.TrackSubscribed,
    ParticipantEvent.TrackUnsubscribed,
    ParticipantEvent.LocalTrackPublished,
    ParticipantEvent.LocalTrackUnpublished,
  ).pipe(
    map((participant) => {
      const pub = participant.getTrack(source);
      return pub?.isMuted ?? true;
    }),
    startWith(participant.getTrack(source)?.isMuted ?? true),
  );
}

export function createIsSpeakingObserver(participant: Participant) {
  return participantEventSelector(participant, ParticipantEvent.IsSpeakingChanged).pipe(
    map(([isSpeaking]) => isSpeaking),
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

export function participantPermissionObserver(participant: Participant) {
  const observer = participantEventSelector(
    participant,
    ParticipantEvent.ParticipantPermissionsChanged,
  ).pipe(
    map(() => participant.permissions),
    startWith(participant.permissions),
  );
  return observer;
}
