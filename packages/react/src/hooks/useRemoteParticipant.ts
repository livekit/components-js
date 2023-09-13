import { connectedParticipantObserver } from '@livekit/components-core';
import type { ParticipantEvent, RemoteParticipant } from 'livekit-client';
import * as React from 'react';
import { useRoomContext } from '../context';
import { useObservableState } from './internal';

/** @public */
export interface UseRemoteParticipantOptions {
  /**
   * To optimize performance, you can use the `updateOnlyOn` property to decide on what `ParticipantEvents` the hook updates.
   * By default it updates on all relevant ParticipantEvents to keep the returned participant up to date.
   */
  updateOnlyOn?: ParticipantEvent[];
}

/**
 * The `useRemoteParticipant` hook returns the RemoteParticipant with the given `identity`.
 * @remarks
 * To optimize performance, you can use the `updateOnlyOn` property to decide on what `ParticipantEvents` the hook updates.
 *
 * @example
 * ```tsx
 * const participant = useRemoteParticipant('Russ');
 * ```
 * @public
 */
export function useRemoteParticipant(
  identity: string,
  options: UseRemoteParticipantOptions = {},
): RemoteParticipant | undefined {
  const room = useRoomContext();
  const [updateOnlyOn] = React.useState(options.updateOnlyOn);

  const observable = React.useMemo(
    () => connectedParticipantObserver(room, identity, { additionalEvents: updateOnlyOn }),
    [room, identity, updateOnlyOn],
  );
  const participant = useObservableState(
    observable,
    room.getParticipantByIdentity(identity) as RemoteParticipant | undefined,
  );
  return participant;
}
