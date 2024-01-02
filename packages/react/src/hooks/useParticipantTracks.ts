import * as React from 'react';
import type { TrackReference } from '@livekit/components-core';
import { participantTracksObservable } from '@livekit/components-core';
import { useObservableState } from './internal';
import type { Participant, Track } from 'livekit-client';
import { useMaybeParticipantContext } from '../context';

/**
 * @public
 */
export function useParticipantTracks(
  sources: Track.Source[],
  participant?: Participant,
): TrackReference[] {
  const participantContext = useMaybeParticipantContext();
  const p = participant ?? participantContext;
  const observable = React.useMemo(
    () => (p ? participantTracksObservable(p, { sources }) : undefined),
    [p?.sid, p?.identity, JSON.stringify(sources)],
  );

  const trackRefs = useObservableState(observable, [] as TrackReference[]);

  return trackRefs;
}
