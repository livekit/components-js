import { map, Observable, startWith } from 'obsrvbl';
import type { Participant, TrackPublication } from 'livekit-client';
import { Room, RoomEvent } from 'livekit-client';
import type { RoomEventCallbacks } from 'livekit-client/dist/src/room/Room';
export function observeRoomEvents(room: Room, ...events: RoomEvent[]): Observable<Room> {
  const observable = new Observable<Room>((subscribe) => {
    const onRoomUpdate = () => {
      subscribe.next(room);
    };

    events.forEach((evt) => {
      room.on(evt, onRoomUpdate);
    });

    const unsubscribe = () => {
      events.forEach((evt) => {
        room.off(evt, onRoomUpdate);
      });
    };
    return unsubscribe;
  }).pipe(startWith(room));

  return observable;
}

export function roomEventSelector<T extends RoomEvent>(room: Room, event: T) {
  const observable = new Observable<Parameters<RoomEventCallbacks[T]>>((subscribe) => {
    type Callback = RoomEventCallbacks[T];
    const update: Callback = (...params: Array<any>) => {
      // @ts-ignore
      subscribe.next(params);
    };
    room.on(event, update);

    const unsubscribe = () => {
      room.off(event, update);
    };
    return unsubscribe;
  });

  return observable;
}

export function roomObserver(room: Room) {
  const observable = observeRoomEvents(
    room,
    RoomEvent.ParticipantConnected,
    RoomEvent.ParticipantDisconnected,
    RoomEvent.ActiveSpeakersChanged,
    RoomEvent.TrackSubscribed,
    RoomEvent.TrackUnsubscribed,
    RoomEvent.LocalTrackPublished,
    RoomEvent.LocalTrackUnpublished,
    RoomEvent.AudioPlaybackStatusChanged,
    RoomEvent.ConnectionStateChanged,
  ).pipe(startWith(room));

  return observable;
}

export function connectionStateObserver(room: Room) {
  return roomEventSelector(room, RoomEvent.ConnectionStateChanged).pipe(
    map(([connectionState]) => connectionState),
    startWith(room.state),
  );
}
export type ScreenShareTrackMap = Array<{
  participant: Participant;
  tracks: Array<TrackPublication>;
}>;

export function roomInfoObserver(room: Room) {
  const observer = observeRoomEvents(
    room,
    RoomEvent.RoomMetadataChanged,
    RoomEvent.ConnectionStateChanged,
  ).pipe(
    map((r) => {
      return { name: r.name, metadata: r.metadata };
    }),
  );
  return observer;
}

export function activeSpeakerObserver(room: Room) {
  return roomEventSelector(room, RoomEvent.ActiveSpeakersChanged).pipe(
    map(([speakers]) => speakers),
  );
}

export function createMediaDeviceObserver(kind?: MediaDeviceKind, requestPermissions = true) {
  let observable = Observable.from<Promise<MediaDeviceInfo[]>>([]);

  if (typeof window !== 'undefined') {
    if (!window.isSecureContext) {
      throw new Error(
        `Accessing media devices is available only in secure contexts (HTTPS and localhost), in some or all supporting browsers. See: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/mediaDevices`,
      );
    }
    observable = observable.concat(
      Observable.fromEvent(navigator.mediaDevices, 'devicechange').map(async () => {
        const deviceInfo = await Room.getLocalDevices(kind, requestPermissions);
        return deviceInfo;
      }),
    );
  }
  return observable;
}

export function createDataObserver(room: Room) {
  return roomEventSelector(room, RoomEvent.DataReceived);
}
