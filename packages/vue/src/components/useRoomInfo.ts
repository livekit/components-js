import { roomInfoObserver } from '@livekit/components-core';
import { Room } from 'livekit-client';
import { useObservable } from '../lib/utils';
import { useRoomContext } from './useRoom';

export function useRoomInfo() {
  const room = useRoomContext();
  const info = useObservable(roomInfoObserver(room), {
    name: room.name,
    metadata: room.metadata,
  });
  return info;
}
