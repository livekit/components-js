import { participantPermissionObserver } from '@livekit/components-core';
import type { ParticipantPermission } from '@livekit/protocol';
import type { Participant } from 'livekit-client';
import * as React from 'react';
import { useEnsureParticipant } from '../context';
import { useObservableState } from './internal/useObservableState';

/**
 * The `useParticipantPermissions` hook returns the permissions of a given participant.
 *
 * @example
 * ```tsx
 * const permissions = useParticipantPermissions({ participant });
 * ```
 * @public
 */
export interface UseParticipantPermissionsOptions {
  participant?: Participant;
}

/** @public */
export function useParticipantPermissions(
  options: UseParticipantPermissionsOptions = {},
): ParticipantPermission | undefined {
  const p = useEnsureParticipant(options.participant);
  const permissionObserver = React.useMemo(() => participantPermissionObserver(p), [p]);
  const permissions = useObservableState(permissionObserver, p.permissions);
  return permissions;
}
