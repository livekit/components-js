import { roomInfoObserver } from '@livekit/components-core';
import { Room } from 'livekit-client';
import React, { HTMLAttributes, useCallback, useEffect, useState } from 'react';

import { useRoomContext } from '../contexts';

export const useRoomInfo = (room: Room) => {
  const [name, setName] = useState(room.name);
  const [metadata, setMetadata] = useState(room.metadata);

  const handleUpdate = useCallback(
    (info: { name: string; metadata: string | undefined }) => {
      console.log('room info update', info);
      setName(info.name);
      setMetadata(info.metadata);
    },
    [room],
  );

  useEffect(() => {
    const listener = roomInfoObserver(room).subscribe(handleUpdate);
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
