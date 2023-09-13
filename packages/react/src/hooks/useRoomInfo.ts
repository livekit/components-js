import { roomInfoObserver } from '@livekit/components-core';
import type { Room } from 'livekit-client';
import * as React from 'react';
import { useEnsureRoom } from '../context';
import { useObservableState } from './internal';

/**
 * The `useRoomInfo` hook returns the name and metadata of the given `Room`.
 * @remarks
 * Needs to be called inside a `RoomContext` or by passing a `Room` instance.
 *
 * @example
 * ```tsx
 * const { name, metadata } = useRoomInfo();
 * ```
 * @public
 */
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
