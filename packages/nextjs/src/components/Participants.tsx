import { useRoom } from './LiveKitRoom';
import React, { ReactNode } from 'react';
import type { Participant } from 'livekit-client';

type ParticipantsProps = {
  children: ReactNode | ReactNode[];
};

export const Participants = ({ children }: ParticipantsProps) => {
  const roomState = useRoom();

  const childrenWithProps = (participant: Participant) => {
    return React.Children.map(children, (child) => {
      // Checking isValidElement is the safe way and avoids a typescript
      // error too.
      if (React.isValidElement(child) && React.Children.only(children)) {
        // @ts-ignore
        return React.cloneElement(child, { participant, key: participant.identity });
      }
      return child;
    });
  };

  return <>{roomState.participants.map((participant) => childrenWithProps(participant))}</>;
};
