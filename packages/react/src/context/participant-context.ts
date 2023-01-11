import { Participant } from 'livekit-client';
import * as React from 'react';

export const ParticipantContext = React.createContext<Participant | undefined>(undefined);

export function useParticipantContext() {
  const participant = React.useContext(ParticipantContext);
  if (!participant) {
    throw Error('tried to access participant context outside of participant context provider');
  }
  return participant;
}

export function useMaybeParticipantContext() {
  return React.useContext(ParticipantContext);
}

export function useEnsureParticipant(participant?: Participant) {
  const context = useMaybeParticipantContext();
  const p = participant ?? context;
  if (!p) {
    throw new Error(
      'No participant provided, make sure you are inside a participant context or pass the participant explicitly',
    );
  }
  return p;
}
