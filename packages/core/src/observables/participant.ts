import type { ParticipantPermission } from '@livekit/protocol';
import { Participant, RemoteParticipant, Room, TrackPublication } from 'livekit-client';
import { ParticipantEvent, RoomEvent, Track } from 'livekit-client';
// @ts-ignore some module resolutions (other than 'node') choke on this
import type { ParticipantEventCallbacks } from 'livekit-client/dist/src/room/participant/Participant';
import type { Subscriber } from 'rxjs';
import { Observable, map, startWith, switchMap } from 'rxjs';
import { getTrackByIdentifier } from '../components/mediaTrack';
import { allParticipantEvents, allParticipantRoomEvents } from '../helper/eventGroups';
import type { TrackReferenceOrPlaceholder } from '../track-reference';
import type { ParticipantIdentifier, TrackIdentifier } from '../types';
import { observeRoomEvents } from './room';

export function observeParticipantEvents<T extends Participant>(
  participant: T,
  ...events: ParticipantEvent[]
) {
  const observable = new Observable<T>((subscribe) => {
    const onParticipantUpdate = () => {
      subscribe.next(participant);
    };

    events.forEach((evt) => {
      participant.on(evt as keyof ParticipantEventCallbacks, onParticipantUpdate);
    });

    const unsubscribe = () => {
      events.forEach((evt) => {
        participant.off(evt as keyof ParticipantEventCallbacks, onParticipantUpdate);
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
    ParticipantEvent.LocalTrackPublished,
    ParticipantEvent.LocalTrackUnpublished,
    ParticipantEvent.MediaDevicesError,
    ParticipantEvent.TrackSubscriptionStatusChanged,
    // ParticipantEvent.ConnectionQualityChanged,
  ).pipe(
    map((p) => {
      const { isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } = p;
      const microphoneTrack = p.getTrackPublication(Track.Source.Microphone);
      const cameraTrack = p.getTrackPublication(Track.Source.Camera);
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

export function participantInfoObserver(participant?: Participant) {
  if (!participant) {
    return undefined;
  }
  const observer = observeParticipantEvents(
    participant,
    ParticipantEvent.ParticipantMetadataChanged,
    ParticipantEvent.ParticipantNameChanged,
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
  const observable = new Observable<
    Parameters<ParticipantEventCallbacks[Extract<T, keyof ParticipantEventCallbacks>]>
  >((subscribe) => {
    const update = (
      ...params: Parameters<ParticipantEventCallbacks[Extract<T, keyof ParticipantEventCallbacks>]>
    ) => {
      subscribe.next(params);
    };
    // @ts-expect-error not a perfect overlap between ParticipantEvent and keyof ParticipantEventCallbacks
    participant.on(event, update);

    const unsubscribe = () => {
      // @ts-expect-error not a perfect overlap between ParticipantEvent and keyof ParticipantEventCallbacks
      participant.off(event, update);
    };
    return unsubscribe;
  });

  return observable;
}

export function mutedObserver(trackRef: TrackReferenceOrPlaceholder) {
  return observeParticipantEvents(
    trackRef.participant,
    ParticipantEvent.TrackMuted,
    ParticipantEvent.TrackUnmuted,
    ParticipantEvent.TrackSubscribed,
    ParticipantEvent.TrackUnsubscribed,
    ParticipantEvent.LocalTrackPublished,
    ParticipantEvent.LocalTrackUnpublished,
  ).pipe(
    map((participant) => {
      const pub = trackRef.publication ?? participant.getTrackPublication(trackRef.source);
      return pub?.isMuted ?? true;
    }),
    startWith(
      trackRef.publication?.isMuted ??
        trackRef.participant.getTrackPublication(trackRef.source)?.isMuted ??
        true,
    ),
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
  }).pipe(startWith(Array.from(room.remoteParticipants.values())));

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
    subscriber?.next(Array.from(r.remoteParticipants.values())),
  );
  if (room.remoteParticipants.size > 0) {
    subscriber?.next(Array.from(room.remoteParticipants.values()));
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

export function participantPermissionObserver(
  participant: Participant,
): Observable<ParticipantPermission | undefined> {
  const observer = participantEventSelector(
    participant,
    ParticipantEvent.ParticipantPermissionsChanged,
  ).pipe(
    map(() => participant.permissions),
    startWith(participant.permissions),
  );
  return observer;
}

export function participantByIdentifierObserver(
  room: Room,
  { kind, identity }: ParticipantIdentifier,
  options: ConnectedParticipantObserverOptions = {},
): Observable<RemoteParticipant | undefined> {
  const additionalEvents = options.additionalEvents ?? allParticipantEvents;
  const matchesIdentifier = (participant: RemoteParticipant) => {
    let isMatch = true;
    if (kind) {
      isMatch = isMatch && participant.kind === kind;
    }
    if (identity) {
      isMatch = isMatch && participant.identity === identity;
    }
    return isMatch;
  };
  const observable = observeRoomEvents(
    room,
    RoomEvent.ParticipantConnected,
    RoomEvent.ParticipantDisconnected,
    RoomEvent.ConnectionStateChanged,
  ).pipe(
    switchMap((r) => {
      const participant = Array.from(r.remoteParticipants.values()).find((p) =>
        matchesIdentifier(p),
      );
      if (participant) {
        return observeParticipantEvents(participant, ...additionalEvents);
      } else {
        return new Observable<undefined>((subscribe) => subscribe.next(undefined));
      }
    }),
    startWith(Array.from(room.remoteParticipants.values()).find((p) => matchesIdentifier(p))),
  );

  return observable;
}

export function participantAttributesObserver(participant: Participant): Observable<{
  changed: Readonly<Record<string, string>>;
  attributes: Readonly<Record<string, string>>;
}>;
export function participantAttributesObserver(participant: undefined): Observable<{
  changed: undefined;
  attributes: undefined;
}>;
export function participantAttributesObserver(participant: Participant | undefined) {
  if (typeof participant === 'undefined') {
    return new Observable<{ changed: undefined; attributes: undefined }>();
  }
  return participantEventSelector(participant, ParticipantEvent.AttributesChanged).pipe(
    map(([changedAttributes]) => {
      return {
        changed: changedAttributes as Readonly<Record<string, string>>,
        attributes: participant.attributes,
      };
    }),
    startWith({ changed: participant.attributes, attributes: participant.attributes }),
  );
}
