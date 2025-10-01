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
 * `useParticipantTracks` is a custom React that allows you to get tracks of a specific participant only, by specifiying the participant's identity.
 * If the participant identity is not passed the hook will try to get the participant from a participant context.
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
