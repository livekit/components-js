import { participantByKindObserver } from '@livekit/components-core';
import type { ParticipantEvent, ParticipantKind, RemoteParticipant } from 'livekit-client';
import * as React from 'react';
import { useRoomContext } from '../context';

/** @alpha */
export interface UseRemoteParticipantByKindOptions {
  /**
   * To optimize performance, you can use the `updateOnlyOn` property to decide on what `ParticipantEvents` the hook updates.
   * By default it updates on all relevant ParticipantEvents to keep the returned participant up to date.
   */
  updateOnlyOn?: ParticipantEvent[];
}

/**
 * The `useRemoteParticipant` hook returns the first RemoteParticipant of the given `kind`.
 * @remarks
 * To optimize performance, you can use the `updateOnlyOn` property to decide on what `ParticipantEvents` the hook updates.
 *
 * @example
 * ```tsx
 * const agent = useRemoteParticipantByKind(ParticipantKind.Agent);
 * ```
 * @alpha
 */
export function useRemoteParticipantByKind(
  kind: ParticipantKind,
  options: UseRemoteParticipantByKindOptions = {},
): RemoteParticipant | undefined {
  const room = useRoomContext();
  const [updateOnlyOn] = React.useState(options.updateOnlyOn);

  const observable = React.useMemo(
    () => participantByKindObserver(room, kind, { additionalEvents: updateOnlyOn }),
    [room, kind, updateOnlyOn],
  );

  // Using `wrapperParticipant` to ensure a new object reference,
  // triggering a re-render when the participant events fire.
  const [participantWrapper, setParticipantWrapper] = React.useState({
    p: Array.from(room.remoteParticipants.values()).find(
      (participant) => participant.kind === kind,
    ),
  });
  React.useEffect(() => {
    const listener = observable.subscribe((p) => setParticipantWrapper({ p }));
    return () => listener.unsubscribe();
  }, [observable]);

  return participantWrapper.p;
}
