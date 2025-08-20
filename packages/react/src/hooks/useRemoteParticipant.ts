import { type RemoteParticipantSignalState, Signal } from '@livekit/components-core';

import { useRoomContext } from '../context';
import { useSignal } from './useSignal';
import { useMemo } from 'react';
/**
 * The `useRemoteParticipant` hook returns the first RemoteParticipant by either identity or based on the participant kind.
 * @remarks
 * To optimize performance, you can use the `updateOnlyOn` property to decide on what `ParticipantEvents` the hook updates.
 *
 * @example
 * ```tsx
 * const participant = useRemoteParticipant('Russ');
 * ```
 * @public
 */
export function useRemoteParticipant(identity: string): RemoteParticipantSignalState | undefined {
  const ctx = useRoomContext();

  const targetParticipant = useMemo(
    () =>
      new Signal.Computed(() =>
        ctx.roomState.remoteParticipants.get().find((p) => p.identity === identity),
      ),
    [identity, ctx.roomState],
  );

  return useSignal(targetParticipant);
}

export function useTest() {
  const remoteParticipant = useRemoteParticipant('test');
  const muted = useSignalSelector(remoteParticipant, (state) => state.muted);
}
