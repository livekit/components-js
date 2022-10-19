import { Room, RoomEvent } from 'livekit-client';
import { map } from 'rxjs';
import { observeRoomEvents } from '../observables/room';
import { lkClassName } from '../utils';

function roomAudioPlaybackAllowedObservable(room: Room) {
  const observable = observeRoomEvents(room, RoomEvent.AudioPlaybackStatusChanged).pipe(
    map((room) => {
      return { canPlayAudio: room.canPlaybackAudio };
    }),
  );
  return observable;
}

export function setupStartAudio() {
  const handleStartAudioPlayback = (room: Room) => {
    console.log('Start Audio for room: ', room);
    room.startAudio();
  };
  const className = lkClassName('start-audio');
  return { className, roomAudioPlaybackAllowedObservable, handleStartAudioPlayback };
}
