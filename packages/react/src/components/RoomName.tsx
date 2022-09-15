import { roomInfoObserver } from '@livekit/components-core';
import { Room } from 'livekit-client';
import React, { HTMLAttributes, useCallback, useEffect, useState } from 'react';

import { useRoomContext } from '../contexts';

export const useRoomInfo = (room: Room) => {
  const [name, setName] = useState(room.name);
  const [metadata, setMetadata] = useState(room.metadata);

  const handleUpdate = useCallback(
    (r: Room) => {
      console.log('room info update', r);
      setName(r.name);
      setMetadata(r.metadata);
    },
    [room],
  );

  useEffect(() => {
    const listener = roomInfoObserver(room, handleUpdate);
    return listener.unsubscribe();
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
