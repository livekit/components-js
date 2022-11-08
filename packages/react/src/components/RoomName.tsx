import { roomInfoObserver } from '@livekit/components-core';
import { Room } from 'livekit-client';
import * as React from 'react';

import { useRoomContext } from '../contexts';
import { useObservableState } from '../utils';

export const useRoomInfo = (room: Room) => {
  const infoObserver = React.useMemo(() => roomInfoObserver(room), [room]);
  const { name, metadata } = useObservableState(infoObserver, {
    name: room.name,
    metadata: room.metadata,
  });

  return { name, metadata };
};

export interface RoomNameProps extends React.HTMLAttributes<HTMLSpanElement> {
  childrenPosition?: 'before' | 'after';
}

export const RoomName = ({
  childrenPosition = 'before',
  children,
  ...htmlAttributes
}: RoomNameProps) => {
  const room = useRoomContext();
  const { name } = useRoomInfo(room);

  return (
    <span {...htmlAttributes}>
      {childrenPosition === 'before' && children}
      {name}
      {childrenPosition === 'after' && children}
    </span>
  );
};
