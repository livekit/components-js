import * as React from 'react';
import type { TrackReference } from '@livekit/components-core';
import { participantTracksObservable } from '@livekit/components-core';
import { useObservableState } from './internal';
import type { Room, Track } from 'livekit-client';
import { useMaybeParticipantContext } from '../context';
import { useParticipants } from './useParticipants';

type UseParticipantTracksOptions = {
  participantIdentity?: string;
  room?: Room;
};

/**
 * Hook to acquire the tracks of a specific participant only. By default the hook will look in the component tree for a {@link ParticipantContext}.
 * To specify a different participant, pass their `identity`.
 *
 * You may also filter the returned tracks by `Source` (e.g. `Camera`, `Microphone`, `ScreenShare`, etc).
 *
 * @public
 */
export function useParticipantTracks<TrackSource extends Track.Source>(
  sources: Array<TrackSource>,
  optionsOrParticipantIdentity:
    | UseParticipantTracksOptions
    | UseParticipantTracksOptions['participantIdentity'] = {},
): Array<TrackReference> {
  let participantIdentity: UseParticipantTracksOptions['participantIdentity'];
  let room: UseParticipantTracksOptions['room'];
  if (typeof optionsOrParticipantIdentity === 'string') {
    participantIdentity = optionsOrParticipantIdentity;
  } else {
    participantIdentity = optionsOrParticipantIdentity?.participantIdentity;
    room = optionsOrParticipantIdentity?.room;
  }

  const participantContext = useMaybeParticipantContext();
  const participants = useParticipants({ room, updateOnlyOn: [] });

  const p = React.useMemo(() => {
    if (participantIdentity) {
      return participants.find((p) => p.identity === participantIdentity);
    }
    return participantContext;
  }, [participantIdentity, participants, participantContext]);

  const observable = React.useMemo(() => {
    if (!p) {
      return undefined;
    }
    return participantTracksObservable(p, { sources });
  }, [p, JSON.stringify(sources)]);

  const trackRefs = useObservableState(observable, [] as Array<TrackReference>);

  return trackRefs;
}
