import { roomInfoObserver } from '@livekit/components-core';
import { Room } from 'livekit-client';
import React, { HTMLAttributes, useCallback, useEffect, useState } from 'react';

import { useRoomContext } from '../contexts';
import { useObservableState } from '../utils';

export const useRoomInfo = (room: Room) => {
  const { name, metadata } = useObservableState(
    roomInfoObserver(room),
    { name: room.name, metadata: room.metadata },
    [room],
  );

  return { name, metadata };
};

export const RoomName = (props: HTMLAttributes<HTMLSpanElement>) => {
  const room = useRoomContext();
  const { name } = useRoomInfo(room);
  return (
    <span {...props}>
      {name} {props.children}
    </span>
  );
};
