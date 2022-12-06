import * as React from 'react';
import { Participant } from 'livekit-client';
import { useLocalParticipant } from '../components/controls/MediaControlButton';
import {
  connectedParticipantsObserver,
  activeSpeakerObserver,
  sortParticipantsByVolume,
} from '@livekit/components-core';
import { useObservableState } from '../utils';
import { useRoomContext } from '../contexts';

/**
 * The useParticipants hook returns all participants of the current room.
 * It is possible to filter the participants.
 */
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

/**
 * The useRemoteParticipants
 */
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

/**
 * The useSpeakingParticipants hook returns the only the active speakers of all participants.
 */
export const useSpeakingParticipants = () => {
  const room = useRoomContext();
  const speakerObserver = React.useMemo(() => activeSpeakerObserver(room), [room]);
  const activeSpeakers = useObservableState(speakerObserver, room.activeSpeakers);
  return activeSpeakers;
};

/**
 * The useSortedParticipants hook returns the only the active speakers of all participants.
 */
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
