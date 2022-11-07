import { map, Observable, startWith, Subscriber, Subscription } from 'rxjs';
import { Participant, Room, RoomEvent, Track, TrackPublication } from 'livekit-client';
import { RoomEventCallbacks } from 'livekit-client/dist/src/room/Room';
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
  ).pipe(startWith(room));

  return observable;
};

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
    let trackMap = screenShareTracks.find((tr) => tr.participant.identity === participant.identity);
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
      trackMap = {
        participant,
        tracks: getScreenShareTracks(participant),
      };
    } else {
      const index = screenShareTracks.indexOf(trackMap);
      screenShareTracks.splice(index, 1);
      trackMap.tracks = getScreenShareTracks(participant);
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
      handleSub(...args);
    }),
  );
  observers.push(
    roomEventSelector(room, RoomEvent.TrackMuted).subscribe((args) => {
      handleSub(...args);
    }),
  );
  observers.push(
    roomEventSelector(room, RoomEvent.TrackUnmuted).subscribe((args) => {
      handleSub(...args);
    }),
  );
  setTimeout(() => {
    // TODO find way to avoid this timeout
    for (const p of room.participants.values()) {
      p.getTracks().forEach((track) => {
        handleSub(track, p);
      });
    }
  }, 1);

  return observable;
}

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

export const createMediaDeviceObserver = (kind?: MediaDeviceKind, requestPermissions = true) => {
  let deviceSubscriber: Subscriber<MediaDeviceInfo[]> | undefined;
  const onDeviceChange = async () => {
    const newDevices = await Room.getLocalDevices(kind, requestPermissions);
    deviceSubscriber?.next(newDevices);
  };
  const observable = new Observable<MediaDeviceInfo[]>((subscriber) => {
    deviceSubscriber = subscriber;
    navigator?.mediaDevices.addEventListener('devicechange', onDeviceChange);
    return () => navigator?.mediaDevices.removeEventListener('devicechange', onDeviceChange);
  });
  // because we rely on an async function, trigger the first update instead of using startWith
  if (typeof window !== 'undefined') {
    onDeviceChange();
  }
  return observable;
};

export const createDataObserver = (room: Room) => {
  return roomEventSelector(room, RoomEvent.DataReceived);
};
