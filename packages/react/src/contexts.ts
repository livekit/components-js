import { Participant } from 'livekit-client';
import { createContext, useContext } from 'react';

const ParticipantContext = createContext<Participant | undefined>(undefined);

const useParticipantContext = () => {
  const participant = useContext(ParticipantContext);
  if (!participant) {
    throw Error('tried to access participant context outside of participant context provider');
  }
  return participant;
};

export { ParticipantContext, useParticipantContext };
