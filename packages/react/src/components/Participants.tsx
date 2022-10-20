import { ParticipantContext, useRoomContext } from '../contexts';
import React, { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
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
  children: ReactNode | ReactNode[];
  filterDependencies?: Array<unknown>;
  filter?: (participants: Array<Participant>) => Array<Participant>;
};

export const useRemoteParticipants = (
  filter?: (participants: Array<Participant>) => Array<Participant>,
) => {
  const room = useRoomContext();
  const [participants, setParticipants] = useState<Participant[]>([]);

  const handleUpdate = useCallback(
    (participants: Participant[]) => {
      if (filter) {
        participants = filter(participants);
      }
      setParticipants(participants);
    },
    [participants, filter],
  );
  useEffect(() => {
    const listener = connectedParticipantsObserver(room).subscribe(handleUpdate);
    return () => listener.unsubscribe();
  }, [room]);
  return participants;
};

export const useParticipants = (
  filter?: (participants: Array<Participant>) => Array<Participant>,
  filterDependencies: Array<unknown> = [],
) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const remoteParticipants = useRemoteParticipants(undefined);
  const { localParticipant } = useLocalParticipant();

  useEffect(() => {
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
  const speakerObserver = useMemo(() => activeSpeakerObserver(room), [room]);
  const activeSpeakers = useObservableState(speakerObserver, room.activeSpeakers);
  return activeSpeakers;
};

export const useSortedParticipants = (participants?: Array<Participant>) => {
  const ps = participants ?? useParticipants();
  const [sortedParticipants, setSortedParticipants] = useState(sortParticipantsByVolume(ps));
  const activeSpeakers = useSpeakingParticipants();

  useEffect(() => {
    setSortedParticipants(sortParticipantsByVolume(ps));
  }, [activeSpeakers, ps]);
  return sortedParticipants;
};

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
