import type { Room } from 'livekit-client';
import { log } from '../logger';
import { roomVideoPlaybackAllowedObservable } from '../observables/room';
import { prefixClass } from '../styles-interface';

export function setupStartVideo() {
  const handleStartVideoPlayback = async (room: Room) => {
    log.info('Start Video for room: ', room);
    await room.startVideo();
  };
  const className: string = prefixClass('start-audio-button');
  return { className, roomVideoPlaybackAllowedObservable, handleStartVideoPlayback };
}
