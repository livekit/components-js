import type { RoomSignalState } from '@livekit/components-core';
import { useRoomContext } from '../context';
import type { AnySignal } from './useSignal';
import { useSignal } from './useSignal';
import { useParticipantStateSelector } from './useParticipantStateSelector';

export function useRoomStateSelector<R>(selector: (state: RoomSignalState) => AnySignal<R>): R {
  const ctx = useRoomContext();
  return useSignal(selector(ctx.roomState));
}

function useMetadata() {
  const participants = useRoomStateSelector((state) => state.remoteParticipants);

  const participantMetadata = useSignal(participants[0].metadata);

  useParticipantStateSelector('jonas', (state) => state.metadata);

  return participantMetadata;
}
