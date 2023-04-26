import * as React from 'react';
import type { Participant } from 'livekit-client';
import { participantPermissionObserver } from '@livekit/components-core';
import { useEnsureParticipant } from '../context';
import { useObservableState } from './internal/useObservableState';

/** @public */
export interface UseParticipantPermissionsOptions {
  participant?: Participant;
}

/** @public */
export function useParticipantPermissions(options: UseParticipantPermissionsOptions = {}) {
  const p = useEnsureParticipant(options.participant);
  const permissionObserver = React.useMemo(() => participantPermissionObserver(p), [p]);
  const permissions = useObservableState(permissionObserver, p.permissions);
  return permissions;
}
