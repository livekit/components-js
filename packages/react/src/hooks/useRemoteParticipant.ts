import { connectedParticipantObserver } from '@livekit/components-core';
import type { ParticipantEvent, RemoteParticipant } from 'livekit-client';
import * as React from 'react';
import { useRoomContext } from '../context';
import { useObservableState } from './internal';

/** @public */
export interface UseRemoteParticipantOptions {
  updateOnlyOn?: ParticipantEvent[];
}

/** @public */
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
