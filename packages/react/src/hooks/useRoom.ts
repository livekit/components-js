import type { RemoteParticipantSignalState } from '@livekit/components-core';
import { createRoomSignalState, type RoomSignalState } from '@livekit/components-core';
import { Room } from 'livekit-client';
import { useEffect, useMemo, useState } from 'react';
import type { AnySignal } from './useSignal';
import { useSignal } from './useSignal';
import { useRoomContext } from '../context';

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

export function useRoomStateSelector<R>(selector: (state: RoomSignalState) => AnySignal<R>): R {
  const ctx = useRoomContext();
  return useSignal(selector(ctx.roomState));
}

export function useParticipantStateSelector<R>(
  identity: string,
  selector: (state: RemoteParticipantSignalState) => AnySignal<R>,
) {
  const remoteParticipants = useRoomStateSelector((state) => state.remoteParticipants);
  const participant = useMemo(
    () => remoteParticipants.find((p) => p.identity === identity),
    [remoteParticipants, identity],
  );
  return useSignal(participant ? selector(participant) : undefined);
}

export function useParticipantMetadata(identity: string) {
  return useParticipantStateSelector(identity, (state) => state.metadata);
}
