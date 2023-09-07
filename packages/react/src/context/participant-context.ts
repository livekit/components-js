import type { Participant } from 'livekit-client';
import * as React from 'react';
import { useMaybeTrackRefContext } from './track-reference-context';

/** @public */
export const ParticipantContext = React.createContext<Participant | undefined>(undefined);

/**
 * Ensures that a participant is provided via context.
 * If not inside a `ParticipantContext`, an error is thrown.
 * @public
 */
export function useParticipantContext() {
  const participant = React.useContext(ParticipantContext);
  if (!participant) {
    throw Error('tried to access participant context outside of participant context provider');
  }
  return participant;
}

/**
 * Returns a participant from the `ParticipantContext` if it exists, otherwise `undefined`.
 * @public
 */
export function useMaybeParticipantContext() {
  return React.useContext(ParticipantContext);
}

/**
 * Ensures that a participant is provided, either via context or explicitly as a parameter.
 * If not inside a `ParticipantContext` and no participant is provided, an error is thrown.
 * @public
 */
export function useEnsureParticipant(participant?: Participant) {
  const context = useMaybeParticipantContext();
  const trackContext = useMaybeTrackRefContext();
  const p = participant ?? context ?? trackContext?.participant;
  if (!p) {
    throw new Error(
      'No participant provided, make sure you are inside a participant context or pass the participant explicitly',
    );
  }
  return p;
}
