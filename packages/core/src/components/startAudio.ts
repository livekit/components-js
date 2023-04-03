import type { Room } from 'livekit-client';
import { RoomEvent } from 'livekit-client';
import { map } from 'rxjs';
import log from '../logger';
import { observeRoomEvents } from '../observables/room';
import { prefixClass } from '../styles-interface';

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
  const className: string = prefixClass('start-audio-button');
  return { className, roomAudioPlaybackAllowedObservable, handleStartAudioPlayback };
}
