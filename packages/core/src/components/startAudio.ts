import { Room, RoomEvent } from 'livekit-client';
import { map } from 'rxjs';
import log from '../logger';
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
  const handleStartAudioPlayback = async (room: Room) => {
    log.info('Start Audio for room: ', room);
    await room.startAudio();
  };
  const className: string = lkClassName('start-audio-button');
  return { className, roomAudioPlaybackAllowedObservable, handleStartAudioPlayback };
}
