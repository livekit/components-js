import { roomInfoObserver } from '@livekit/components-core';
import { Room } from 'livekit-client';
import { useObservable } from '../lib/utils';
import { useRoomContext } from './useRoom';

export function useRoomInfo(room?: Room) {
  const currentRoom = room ?? useRoomContext();
  const info = useObservable(roomInfoObserver(currentRoom), {
    name: currentRoom.name,
    metadata: currentRoom.metadata,
  });
  return info;
}
