import * as React from 'react';
import type { TrackReference } from '@livekit/components-core';
import { participantTracksObservable } from '@livekit/components-core';
import { useObservableState } from './internal';
import type { Track } from 'livekit-client';
import { useMaybeParticipantContext } from '../context';
import { useRemoteParticipants } from './useRemoteParticipants';

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
  const participantContext = useMaybeParticipantContext();
  const remoteParticipants = useRemoteParticipants({ updateOnlyOn: [] });

  const p = React.useMemo(() => {
    if (participantIdentity) {
      return remoteParticipants.find((p) => p.identity === participantIdentity);
    }
    return participantContext;
  }, [participantIdentity, remoteParticipants, participantContext]);

  const observable = React.useMemo(() => {
    if (!p) {
      return undefined;
    }
    return participantTracksObservable(p, { sources });
  }, [p, JSON.stringify(sources)]);

  const trackRefs = useObservableState(observable, [] as TrackReference[]);

  return trackRefs;
}
