import { useRoomContext } from './LiveKitRoom';
import React, { ReactNode, useEffect, useState } from 'react';
import { Participant, Room, RoomEvent } from 'livekit-client';
import { observeRoomEvents } from '@livekit/auth-helpers-shared';
import { useLocalParticipant } from './MediaControl';

type ParticipantsProps = {
  children: ReactNode | ReactNode[];
  room?: Room;
};

export const useRemoteParticipants = (room?: Room) => {
  const currentRoom = room ?? useRoomContext();
  const [participants, setParticipants] = useState(Array.from(currentRoom.participants.values()));
  useEffect(() => {
    const listener = observeRoomEvents(
      currentRoom,
      RoomEvent.ParticipantConnected,
      RoomEvent.ParticipantDisconnected,
    ).subscribe((r) => setParticipants(Array.from(r.participants.values())));
    return () => listener.unsubscribe();
  });
  return participants;
};

export const Participants = ({ children, room }: ParticipantsProps) => {
  const participants = useRemoteParticipants(room);
  const localParticipant = useLocalParticipant(room);
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

  return (
    <>{[localParticipant, ...participants].map((participant) => childrenWithProps(participant))}</>
  );
};
