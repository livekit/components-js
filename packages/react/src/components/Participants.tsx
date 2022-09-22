import { ParticipantContext, useRoomContext } from '../contexts';
import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import { Participant, Room } from 'livekit-client';
import { useLocalParticipant } from './controls/MediaControl';
import { connectedParticipantsObserver } from '@livekit/components-core';

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
      console.log('filtered participants', all);
    }
    setParticipants(all);
  }, [remoteParticipants, localParticipant, filter, ...filterDependencies]);

  return participants;
};

export const Participants = ({ children, room, filter, filterDependencies }: ParticipantsProps) => {
  const participants = useParticipants(filter, filterDependencies, room);
  const childrenWithProps = (participant: Participant) => {
    return React.Children.map(children, (child) => {
      // Checking isValidElement is the safe way and avoids a typescript
      // error too.
      if (React.isValidElement(child) && React.Children.only(children)) {
        return (
          <ParticipantContext.Provider value={participant}>
            {React.cloneElement(child, { key: participant.identity })}
          </ParticipantContext.Provider>
        );
      }
      return child;
    });
  };

  return <>{participants.map((participant) => childrenWithProps(participant))}</>;
};
