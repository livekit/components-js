import * as React from 'react';
import type { TrackReference } from '@livekit/components-core';
import { participantTracksObservable } from '@livekit/components-core';
import { useObservableState } from './internal';
import type { Track } from 'livekit-client';
import { useMaybeParticipantContext } from '../context';
import { useRemoteParticipants } from './useRemoteParticipants';

/**
 * `useParticipantTracks` is a custom React that allows you to get tracks of a specific participant only, by specifiying the participant's identity.
 * If the participant identity is not passed the hook will try to get the participant from a participant context.
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
