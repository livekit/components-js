import { ParticipantContext, useRoomContext } from '../contexts';
import React, { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Participant, Room } from 'livekit-client';
import { useLocalParticipant } from './controls/MediaControl';
import { connectedParticipantsObserver, activeSpeakerObserver } from '@livekit/components-core';
import { cloneSingleChild, sortParticipantsByVolume, useObservableState } from '../utils';

type ParticipantsProps = {
  children: ReactNode | ReactNode[];
  room?: Room;
  filterDependencies?: Array<unknown>;
  filter?: (participants: Array<Participant>) => Array<Participant>;
};

export const useRemoteParticipants = (
  filter?: (participants: Array<Participant>) => Array<Participant>,
  room?: Room,
) => {
  const currentRoom = room ?? useRoomContext();
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
    const listener = connectedParticipantsObserver(currentRoom).subscribe(handleUpdate);
    return () => listener.unsubscribe();
  }, [currentRoom]);
  return participants;
};

export const useParticipants = (
  filter?: (participants: Array<Participant>) => Array<Participant>,
  filterDependencies: Array<unknown> = [],
  room?: Room,
) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const remoteParticipants = useRemoteParticipants(undefined, room);
  const { localParticipant } = useLocalParticipant(room);

  useEffect(() => {
    let all = [localParticipant, ...remoteParticipants];
    if (filter) {
      all = filter(all);
    }
    setParticipants(all);
  }, [remoteParticipants, localParticipant, filter, ...filterDependencies]);

  return participants;
};

export const useSpeakingParticipants = (room?: Room) => {
  const currentRoom = room ?? useRoomContext();
  const speakerObserver = useMemo(() => activeSpeakerObserver(currentRoom), [currentRoom]);
  const activeSpeakers = useObservableState(speakerObserver, currentRoom.activeSpeakers);
  return activeSpeakers;
};

export const useSortedParticipants = (participants?: Array<Participant>, room?: Room) => {
  const ps = participants ?? useParticipants();
  const [sortedParticipants, setSortedParticipants] = useState(sortParticipantsByVolume(ps));
  const activeSpeakers = useSpeakingParticipants(room);

  useEffect(() => {
    setSortedParticipants(sortParticipantsByVolume(ps));
  }, [activeSpeakers, ps]);
  return sortedParticipants;
};

export const Participants = ({ children, room, filter, filterDependencies }: ParticipantsProps) => {
  const participants = useParticipants(filter, filterDependencies, room);
  return (
    <>
      {participants.map((participant) => (
        <ParticipantContext.Provider value={participant} key={participant.identity}>
          {cloneSingleChild(children)}
        </ParticipantContext.Provider>
      ))}
    </>
  );
};
