import * as React from 'react';
import type { Participant } from 'livekit-client';
import { Track } from 'livekit-client';
import { participantPermissionObserver, trackReference } from '@livekit/components-core';
import { useEnsureTrackReference } from '../context';
import { useObservableState } from './internal/useObservableState';

export interface UseParticipantPermissionsOptions {
  participant?: Participant;
}

export function useParticipantPermissions(options: UseParticipantPermissionsOptions = {}) {
  const maybeTrackRef = options.participant
    ? trackReference(options.participant, Track.Source.Unknown)
    : undefined;
  const trackRef = useEnsureTrackReference(maybeTrackRef);
  const permissionObserver = React.useMemo(
    () => participantPermissionObserver(trackRef.participant),
    [trackRef.participant],
  );
  const permissions = useObservableState(permissionObserver, trackRef.participant.permissions);
  return permissions;
}
