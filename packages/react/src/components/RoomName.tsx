import { roomInfoObserver } from '@livekit/components-core';
import { Room } from 'livekit-client';
import React, { HTMLAttributes, useCallback, useEffect, useMemo, useState } from 'react';

import { useRoomContext } from '../contexts';
import { useObservableState } from '../utils';

export const useRoomInfo = (room: Room) => {
  const infoObserver = useMemo(() => roomInfoObserver(room), [room]);
  const { name, metadata } = useObservableState(infoObserver, {
    name: room.name,
    metadata: room.metadata,
  });

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
