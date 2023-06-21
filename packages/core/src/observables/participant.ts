import type { Participant, RemoteParticipant, Room, TrackPublication } from 'livekit-client';
import { ParticipantEvent, RoomEvent, Track } from 'livekit-client';
import type { Subscriber } from 'rxjs';
import { map, switchMap, Observable, startWith } from 'rxjs';
import { observeRoomEvents } from './room';
import type { ParticipantEventCallbacks } from 'livekit-client/dist/src/room/participant/Participant';
import { allParticipantEvents, allParticipantRoomEvents } from '../helper/eventGroups';
import type { TrackIdentifier } from '../types';
import { getTrackByIdentifier } from '../components/mediaTrack';

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

export function createTrackObserver(participant: Participant, options: TrackIdentifier) {
  return observeParticipantMedia(participant).pipe(
    map(() => {
      return { publication: getTrackByIdentifier(options) };
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
    const update = (...params: Parameters<ParticipantEventCallbacks[T]>) => {
      subscribe.next(params);
    };
    // @ts-ignore
    participant.on(event, update);

    const unsubscribe = () => {
      // @ts-ignore
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

type ConnectedParticipantsObserverOptions = {
  additionalRoomEvents?: RoomEvent[];
};

export function connectedParticipantsObserver(
  room: Room,
  options: ConnectedParticipantsObserverOptions = {},
) {
  let subscriber: Subscriber<RemoteParticipant[]> | undefined;

  const observable = new Observable<RemoteParticipant[]>((sub) => {
    subscriber = sub;
    return () => listener.unsubscribe();
  }).pipe(startWith(Array.from(room.participants.values())));

  const additionalRoomEvents = options.additionalRoomEvents ?? allParticipantRoomEvents;

  const roomEvents = Array.from(
    new Set([
      RoomEvent.ParticipantConnected,
      RoomEvent.ParticipantDisconnected,
      RoomEvent.ConnectionStateChanged,
      ...additionalRoomEvents,
    ]),
  );

  const listener = observeRoomEvents(room, ...roomEvents).subscribe((r) =>
    subscriber?.next(Array.from(r.participants.values())),
  );
  if (room.participants.size > 0) {
    subscriber?.next(Array.from(room.participants.values()));
  }
  return observable;
}

export type ConnectedParticipantObserverOptions = {
  additionalEvents?: ParticipantEvent[];
};

export function connectedParticipantObserver(
  room: Room,
  identity: string,
  options: ConnectedParticipantObserverOptions = {},
) {
  const additionalEvents = options.additionalEvents ?? allParticipantEvents;
  const observable = observeRoomEvents(
    room,
    RoomEvent.ParticipantConnected,
    RoomEvent.ParticipantDisconnected,
    RoomEvent.ConnectionStateChanged,
  ).pipe(
    switchMap((r) => {
      const participant = r.getParticipantByIdentity(identity) as RemoteParticipant | undefined;
      if (participant) {
        return observeParticipantEvents(participant, ...additionalEvents);
      } else {
        return new Observable<undefined>((subscribe) => subscribe.next(undefined));
      }
    }),
    startWith(room.getParticipantByIdentity(identity) as RemoteParticipant | undefined),
  );

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
