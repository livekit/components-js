import { createRoomSignalState, type RoomSignalState } from '@livekit/components-core';
import { Room } from 'livekit-client';
import { useEffect, useMemo, useState } from 'react';

export function useRoom(room?: Room): { roomState: RoomSignalState } {
  const [abortController] = useState(() => new AbortController());
  const roomState = useMemo(
    () => createRoomSignalState(room ?? new Room(), abortController.signal),
    [room, abortController],
  );
  useEffect(() => {
    return () => {
      abortController.abort();
    };
  }, [abortController, room]);
  return { roomState };
}
