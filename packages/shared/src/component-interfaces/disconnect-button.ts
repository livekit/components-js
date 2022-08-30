import { Room, RoomEvent } from 'livekit-client';
import { roomEventSelector } from '../observables/room';

const connectionStateObserver = (room: Room) =>
  roomEventSelector(room, RoomEvent.ConnectionStateChanged);

export { connectionStateObserver };
