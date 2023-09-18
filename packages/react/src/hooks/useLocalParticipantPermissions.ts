import { participantPermissionObserver } from '@livekit/components-core';
import * as React from 'react';
import { useRoomContext } from '../context';
import { useObservableState } from './internal';

/**
 * The `useLocalParticipantPermissions` hook returns the local participant's permissions.
 *
 * @example
 * ```tsx
 * const { canPublish, canPublishData } = useLocalParticipantPermissions();
 * ```
 * @public
 */
export function useLocalParticipantPermissions() {
  const room = useRoomContext();
  const permissionObserver = React.useMemo(
    () => participantPermissionObserver(room.localParticipant),
    [room],
  );
  const permissions = useObservableState(permissionObserver, room.localParticipant.permissions);
  return permissions;
}
