import type { RemoteParticipantSignalState } from '@livekit/components-core';
import { useRemoteParticipant } from './useRemoteParticipant';
import { useSignal } from './useSignal';
import type { AnySignal } from './useSignal';

export function useParticipantStateSelector<R>(
  identity: string,
  selector: (state: RemoteParticipantSignalState) => AnySignal<R>,
) {
  const participant = useRemoteParticipant(identity);
  return useSignal(participant ? selector(participant) : undefined);
}
