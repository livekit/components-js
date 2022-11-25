import { ParticipantContext, useRoomContext } from '../contexts';
import * as React from 'react';
import { Participant } from 'livekit-client';
import { useLocalParticipant } from './controls/MediaControlButton';
import {
  connectedParticipantsObserver,
  activeSpeakerObserver,
  sortParticipantsByVolume,
} from '@livekit/components-core';
import { cloneSingleChild, useObservableState } from '../utils';
import { ParticipantView } from './participant/Participant';

type ParticipantsProps = {
  children: React.ReactNode | React.ReactNode[];
  filterDependencies?: Array<unknown>;
  filter?: (participants: Array<Participant>) => Array<Participant>;
};

export const useRemoteParticipants = (
  filter?: (participants: Array<Participant>) => Array<Participant>,
) => {
  const room = useRoomContext();
  const [participants, setParticipants] = React.useState<Participant[]>([]);

  const handleUpdate = React.useCallback(
    (participants: Participant[]) => {
      if (filter) {
        participants = filter(participants);
      }
      setParticipants(participants);
    },
    [filter],
  );
  React.useEffect(() => {
    const listener = connectedParticipantsObserver(room).subscribe(handleUpdate);
    return () => listener.unsubscribe();
  }, [handleUpdate, room]);
  return participants;
};

export const useParticipants = (
  filter?: (participants: Array<Participant>) => Array<Participant>,
  filterDependencies: Array<unknown> = [],
) => {
  const [participants, setParticipants] = React.useState<Participant[]>([]);
  const remoteParticipants = useRemoteParticipants(undefined);
  const { localParticipant } = useLocalParticipant();

  React.useEffect(() => {
    let all = [localParticipant, ...remoteParticipants];
    if (filter) {
      all = filter(all);
    }
    setParticipants(all);
  }, [remoteParticipants, localParticipant, filter, ...filterDependencies]);

  return participants;
};

export const useSpeakingParticipants = () => {
  const room = useRoomContext();
  const speakerObserver = React.useMemo(() => activeSpeakerObserver(room), [room]);
  const activeSpeakers = useObservableState(speakerObserver, room.activeSpeakers);
  return activeSpeakers;
};

export const useSortedParticipants = (participants: Array<Participant>) => {
  const [sortedParticipants, setSortedParticipants] = React.useState(
    sortParticipantsByVolume(participants),
  );
  const activeSpeakers = useSpeakingParticipants();

  React.useEffect(() => {
    setSortedParticipants(sortParticipantsByVolume(participants));
  }, [activeSpeakers, participants]);
  return sortedParticipants;
};

/**
 * The Participants component loops over all or a filtered subset of participants to create a visual
 * representation (`ParticipantView`) and context for every participant. This component takes zero or more children.
 * By providing your own `ParticipantView` template as a child you have full control over the look and feel of your
 * participant representations. If no child is provided we render a basic video tile representation for every participant.
 *
 * @remarks
 * Super detailed documentation.
 *
 * @example
 * ```tsx
 * import { Participants } from '@livekit/components-react';
 *
 * {...}
 *   <Participants>
 *     {...}
 *   <Participants />
 * {...}
 * ```
 *
 * @see `ParticipantView` component
 */
export const Participants = ({ children, filter, filterDependencies }: ParticipantsProps) => {
  const participants = useParticipants(filter, filterDependencies);
  return (
    <>
      {participants.map((participant) => (
        <ParticipantContext.Provider value={participant} key={participant.identity}>
          {children ? cloneSingleChild(children) : <ParticipantView />}
        </ParticipantContext.Provider>
      ))}
    </>
  );
};
