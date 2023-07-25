import { roomInfoObserver } from '@livekit/components-core';
import type { Room } from 'livekit-client';
import * as React from 'react';
import { useEnsureRoom } from '../context';
import { useObservableState } from './internal';

/** @public */
export interface UseRoomInfoOptions {
  room?: Room;
}

/** @public */
export function useRoomInfo(options: UseRoomInfoOptions = {}) {
  const room = useEnsureRoom(options.room);
  const infoObserver = React.useMemo(() => roomInfoObserver(room), [room]);
  const { name, metadata } = useObservableState(infoObserver, {
    name: room.name,
    metadata: room.metadata,
  });

  return { name, metadata };
}
