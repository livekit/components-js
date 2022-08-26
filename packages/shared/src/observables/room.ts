import { Observable } from 'rxjs';
import { Room, RoomEvent } from 'livekit-client';
import type { RoomEventCallbacks } from 'livekit-client/dist/src/room/Room';

export const observeRoom = (room: Room) => {
  const { subscribe } = observeRoomEvents(
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

  return { subscribe };
};

function observeRoomEvents(
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

  return { subscribe: observable.subscribe };
}

export function roomEventSelector<T extends RoomEvent>(room: Room, event: T) {
  const observable = new Observable<Parameters<RoomEventCallbacks[T]>>((subscribe) => {
    const update: RoomEventCallbacks[T] = (...params: Array<any>) => {
      subscribe.next(...params);
    };
    room.on(event, update);

    const unsubscribe = () => {
      room.off(event, update);
    };
    return unsubscribe;
  });

  return { subscribe: observable.subscribe };
}

// const room = new Room();

// let connectionState = ConnectionState.Disconnected;
// roomEventSelector(room, RoomEvent.ConnectionStateChanged).subscribe(
//   ([state]) => (connectionState = state),
// );
