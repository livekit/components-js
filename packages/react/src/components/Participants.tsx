import { useRoomContext } from '../contexts';
import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import { Participant, Room } from 'livekit-client';
import { useLocalParticipant } from './MediaControl';
import { connectedParticipants } from '@livekit/components-core';

type ParticipantsProps = {
  children: ReactNode | ReactNode[];
  room?: Room;
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
    return connectedParticipants(currentRoom, handleUpdate);
  }, [currentRoom]);
  return participants;
};

export const useParticipants = (
  filter?: (participants: Array<Participant>) => Array<Participant>,
  room?: Room,
) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const remoteParticipants = useRemoteParticipants(undefined, room);
  const { localParticipant } = useLocalParticipant(room);

  useEffect(() => {
    let all = [localParticipant, ...remoteParticipants];
    if (filter) {
      all = filter(all);
      console.log('filtered participants', all);
    }
    setParticipants(all);
  }, [remoteParticipants, localParticipant, filter]);

  return participants;
};

export const Participants = ({ children, room, filter }: ParticipantsProps) => {
  const participants = useParticipants(filter, room);
  const childrenWithProps = (participant: Participant) => {
    return React.Children.map(children, (child) => {
      // Checking isValidElement is the safe way and avoids a typescript
      // error too.
      if (React.isValidElement(child) && React.Children.only(children)) {
        // @ts-ignore we want to spread those properties on the children no matter what type they are
        return React.cloneElement(child, { participant, key: participant.identity });
      }
      return child;
    });
  };

  return <>{participants.map((participant) => childrenWithProps(participant))}</>;
};
