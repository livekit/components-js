import * as React from 'react';
import type { TrackReference } from '@livekit/components-core';
import { participantTracksObservable } from '@livekit/components-core';
import { useObservableState } from './internal';
import type { Track } from 'livekit-client';
import { useMaybeParticipantContext, useRoomContext } from '../context';

/**
 * Hook to acquire the tracks of a specific participant only. By default the hook will look in the component tree for a {@link ParticipantContext}.
 * To specify a different participant, pass their `identity`.
 *
 * You may also filter the returned tracks by `Source` (e.g. `Camera`, `Microphone`, `ScreenShare`, etc).
 *
 * @public
 */
export function useParticipantTracks(
  sources: Track.Source[],
  participantIdentity?: string,
): TrackReference[] {
  const room = useRoomContext();
  const participantContext = useMaybeParticipantContext();
  const p = participantIdentity
    ? room.getParticipantByIdentity(participantIdentity)
    : participantContext;
  const observable = React.useMemo(
    () => (p ? participantTracksObservable(p, { sources }) : undefined),
    [p?.sid, p?.identity, JSON.stringify(sources)],
  );

  const trackRefs = useObservableState(observable, [] as TrackReference[]);

  return trackRefs;
}
