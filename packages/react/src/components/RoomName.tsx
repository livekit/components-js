import { roomInfoObserver } from '@livekit/components-core';
import type { Room } from 'livekit-client';
import * as React from 'react';

import { useEnsureRoom } from '../context';
import { useObservableState } from '../hooks/internal/useObservableState';

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

/** @public */
export interface RoomNameProps extends React.HTMLAttributes<HTMLSpanElement> {
  childrenPosition?: 'before' | 'after';
}

/**
 * The RoomName component renders the name of the connected LiveKit room inside a span tag.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <RoomName />
 * </LiveKitRoom>
 * ```
 * @public
 */
export const RoomName = ({
  childrenPosition = 'before',
  children,
  ...htmlAttributes
}: RoomNameProps) => {
  const { name } = useRoomInfo();

  return (
    <span {...htmlAttributes}>
      {childrenPosition === 'before' && children}
      {name}
      {childrenPosition === 'after' && children}
    </span>
  );
};
