import type { Room } from 'livekit-client';
import { log } from '../logger';
import { roomAudioPlaybackAllowedObservable } from '../observables/room';
import { prefixClass } from '../styles-interface';

export function setupStartAudio() {
  const handleStartAudioPlayback = async (room: Room) => {
    log.info('Start Audio for room: ', room);
    await room.startAudio();
  };
  const className: string = prefixClass('start-audio-button');
  return { className, roomAudioPlaybackAllowedObservable, handleStartAudioPlayback };
}
