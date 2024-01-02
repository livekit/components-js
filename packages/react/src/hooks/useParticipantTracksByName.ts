import * as React from 'react';
import type { TrackReference } from '@livekit/components-core';
import { participantTracksObservable } from '@livekit/components-core';
import { useObservableState } from './internal';
import type { Participant } from 'livekit-client';
import { useMaybeParticipantContext } from '../context';

/**
 * @public
 */
export function useParticipantTracksByName(
  name: string,
  participant?: Participant,
): TrackReference[] {
  const participantContext = useMaybeParticipantContext();
  const p = participant ?? participantContext;
  const observable = React.useMemo(
    () => (p ? participantTracksObservable(p, { name }) : undefined),
    [p?.sid, p?.identity, name],
  );

  const trackRefs = useObservableState(observable, [] as TrackReference[]);

  return trackRefs;
}
