import type { Participant } from 'livekit-client';
import * as React from 'react';
import { ParticipantContext } from '../context';
import { cloneSingleChild } from '../utils';

type ParticipantLoopProps = {
  /** The participants to loop over. If not provided, the participants from the current room context are used. */
  participants: Participant[];
  children: React.ReactNode;
};

/**
 * The ParticipantLoop component loops over an array of participants to create a visual
 * representation and context for every participant. This component takes zero or more children.
 * By providing your own template as a child you have full control over the look and feel of your
 * participant representations.
 *
 * @remarks
 * If you want to loop over individual tracks instead of participants, you can use the `TrackLoop` component.
 *
 * @example
 * ```tsx
 * const participants = useParticipants();
 * <ParticipantLoop participants={participants}>
 *   <ParticipantName />
 * <ParticipantLoop />
 * ```
 */
export const ParticipantLoop = ({
  participants,
  ...props
}: React.PropsWithChildren<ParticipantLoopProps>) => {
  return (
    <>
      {participants.map((participant) => (
        <ParticipantContext.Provider value={participant} key={participant.identity}>
          {props.children && cloneSingleChild(props.children)}
        </ParticipantContext.Provider>
      ))}
    </>
  );
};
