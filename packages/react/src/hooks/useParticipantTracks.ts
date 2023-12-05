import * as React from 'react';
import type { ParticipantTrackIdentifier, TrackReference } from '@livekit/components-core';
import { participantTracksObservable } from '@livekit/components-core';
import { useObservableState } from './internal';
import type { Participant } from 'livekit-client';

export function useParticipantTracks(
  participant: Participant | undefined,
  trackIdentifier: ParticipantTrackIdentifier,
): TrackReference[] {
  const observable = React.useMemo(
    () => (participant ? participantTracksObservable(participant, trackIdentifier) : undefined),
    [participant?.sid, participant?.identity, JSON.stringify(trackIdentifier)],
  );

  const trackRefs = useObservableState(observable, [] as TrackReference[]);

  return trackRefs;
}
