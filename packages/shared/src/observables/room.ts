import { Observable, Subscriber, Subscription } from 'rxjs';
import { Participant, Room, RoomEvent, Track, TrackPublication } from 'livekit-client';
import type { RoomEventCallbacks } from 'livekit-client/dist/src/room/Room';

export function observeRoomEvents(
  room: Room,
  ...events: RoomEvent[]
): Pick<Observable<Room>, 'subscribe'> {
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
  });

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

export const roomObserver = (room: Room) => {
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
  );

  return observable;
};

export function connectionStateObserver(room: Room) {
  return roomEventSelector(room, RoomEvent.ConnectionStateChanged);
}
export type ScreenShareTrackMap = Array<{
  participantId: string;
  tracks: Array<TrackPublication>;
}>;

export function screenShareObserver(room: Room) {
  let screenShareSubscriber: Subscriber<ScreenShareTrackMap>;
  const observers: Array<Subscription> = [];

  const observable = new Observable<ScreenShareTrackMap>((subscriber) => {
    screenShareSubscriber = subscriber;
    return () => {
      observers.forEach((observer) => {
        observer.unsubscribe();
      });
    };
  });

  const screenShareTracks: ScreenShareTrackMap = [];
  const handleSub = (publication: TrackPublication, participant: Participant) => {
    if (
      publication.source !== Track.Source.ScreenShare &&
      publication.source !== Track.Source.ScreenShareAudio
    ) {
      return;
    }
    let trackMap = screenShareTracks.find((tr) => tr.participantId === participant.identity);
    const getScreenShareTracks = (participant: Participant) => {
      return participant
        .getTracks()
        .filter(
          (track) =>
            (track.source === Track.Source.ScreenShare ||
              track.source === Track.Source.ScreenShareAudio) &&
            track.track,
        );
    };
    if (!trackMap) {
      trackMap = { participantId: participant.identity, tracks: getScreenShareTracks(participant) };
    } else {
      trackMap.tracks = getScreenShareTracks(participant);
      const index = screenShareTracks.indexOf(trackMap);
      screenShareTracks.splice(index, 1);
    }
    if (trackMap.tracks.length > 0) {
      screenShareTracks.push(trackMap);
    }

    screenShareSubscriber.next(screenShareTracks);
  };
  observers.push(
    roomEventSelector(room, RoomEvent.TrackSubscribed).subscribe(([_, ...args]) =>
      handleSub(...args),
    ),
  );
  observers.push(
    roomEventSelector(room, RoomEvent.TrackUnsubscribed).subscribe(([_, ...args]) =>
      handleSub(...args),
    ),
  );
  observers.push(
    roomEventSelector(room, RoomEvent.LocalTrackPublished).subscribe((args) => handleSub(...args)),
  );
  observers.push(
    roomEventSelector(room, RoomEvent.LocalTrackUnpublished).subscribe((args) => {
      console.log('local track unpublished');
      handleSub(...args);
    }),
  );

  for (const p of room.participants.values()) {
    p.getTracks().forEach((track) => {
      handleSub(track, p);
    });
  }
  return observable;
}

export function roomInfoObserver(room: Room, onInfoChange: (r: Room) => void) {
  const observer = observeRoomEvents(
    room,
    RoomEvent.RoomMetadataChanged,
    RoomEvent.ConnectionStateChanged,
  ).subscribe(onInfoChange);
  onInfoChange(room);
  return observer;
}
