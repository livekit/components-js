import {
  Participant,
  ParticipantEvent,
  RemoteParticipant,
  Room,
  RoomEvent,
  Track,
  TrackPublication,
} from 'livekit-client';
import Observable from 'zen-observable';
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
    subscribe.next(participant);
    return unsubscribe;
  });

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
  ).map((p) => {
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
  });

  return participantObserver;
}

export function createTrackObserver(participant: Participant, source: Track.Source) {
  return observeParticipantMedia(participant).map((media) => {
    const publication = media.participant.getTrack(source);
    return { publication };
  });
}

export function participantInfoObserver(participant: Participant) {
  const observer = Observable.of({
    name: participant.name,
    identity: participant.identity,
    metadata: participant.metadata,
  }).concat(
    observeParticipantEvents(
      participant,
      ParticipantEvent.ParticipantMetadataChanged,
      // ParticipantEvent.LocalTrackPublished,
    ).map(({ name, identity, metadata }) => {
      return {
        name,
        identity,
        metadata,
      };
    }),
  );
  return observer;
}

export function createConnectionQualityObserver(participant: Participant) {
  const observer = Observable.of(participant.connectionQuality).concat(
    participantEventSelector(participant, ParticipantEvent.ConnectionQualityChanged).map(
      ([quality]) => quality,
    ),
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
  return Observable.of(participant.getTrack(source)?.isMuted ?? true).concat(
    observeParticipantEvents(
      participant,
      ParticipantEvent.TrackMuted,
      ParticipantEvent.TrackUnmuted,
      ParticipantEvent.TrackSubscribed,
      ParticipantEvent.TrackUnsubscribed,
      ParticipantEvent.LocalTrackPublished,
      ParticipantEvent.LocalTrackUnpublished,
    ).map((participant) => {
      const pub = participant.getTrack(source);
      return pub?.isMuted ?? true;
    }),
  );
}

export function createIsSpeakingObserver(participant: Participant) {
  return participantEventSelector(participant, ParticipantEvent.IsSpeakingChanged).map(
    ([isSpeaking]) => isSpeaking,
  );
}

export function connectedParticipantsObserver(room: Room) {
  let subscriber: ZenObservable.SubscriptionObserver<RemoteParticipant[]> | undefined;

  const observable = Observable.of(Array.from(room.participants.values())).concat(
    new Observable<RemoteParticipant[]>((sub) => {
      subscriber = sub;
      return () => listener.unsubscribe();
    }),
  );

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
