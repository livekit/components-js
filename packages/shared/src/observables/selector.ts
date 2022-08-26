import { Observable } from 'rxjs';
import { RoomEvent, Room } from 'livekit-client';

export const observeRoomEvents = (room: Room, ...events: RoomEvent[]) => {
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
};
