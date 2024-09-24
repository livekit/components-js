import type { Participant } from 'livekit-client';
import * as React from 'react';
import { ParticipantContext } from '../context';
import { cloneSingleChild } from '../utils';

/** @public */
export interface ParticipantLoopProps {
  /** The participants to loop over. Use `useParticipants()` hook to get participants. */
  participants: Participant[];
  /** The template component to be used in the loop. */
  children: React.ReactNode;
}

/**
 * The `ParticipantLoop` component loops over an array of participants to create a context for every participant.
 * This component takes exactly one child component as a template.
 * By providing your own template as a child you have full control over the look and feel of your participant representations.
 *
 * @remarks
 * If you want to loop over individual tracks instead of participants, you can use the `TrackLoop` component.
 *
 * @example
 * ```tsx
 * const participants = useParticipants();
 * <ParticipantLoop participants={participants}>
 *   <ParticipantName />
 * </ParticipantLoop>
 * ```
 * @public
 */
export function ParticipantLoop({ participants, ...props }: ParticipantLoopProps) {
  return (
    <>
      {participants.map((participant) => (
        <ParticipantContext.Provider value={participant} key={participant.identity}>
          {cloneSingleChild(props.children)}
        </ParticipantContext.Provider>
      ))}
    </>
  );
}
