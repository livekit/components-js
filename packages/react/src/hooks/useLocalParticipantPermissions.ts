import { participantPermissionObserver } from '@livekit/components-core';
import * as React from 'react';
import { useRoomContext } from '../context';
import { useObservableState } from './internal';

/** @public */
export function useLocalParticipantPermissions() {
  const room = useRoomContext();
  const permissionObserver = React.useMemo(
    () => participantPermissionObserver(room.localParticipant),
    [room],
  );
  const permissions = useObservableState(permissionObserver, room.localParticipant.permissions);
  return permissions;
}
