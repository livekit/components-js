import { Participant } from 'livekit-client';
import * as React from 'react';
import { ParticipantContext } from '../contexts';
import { useParticipants } from '../hooks';
import { cloneSingleChild } from '../utils';
import { ParticipantView } from './participant/ParticipantView';

type ParticipantsLoopProps = {
  filterDependencies?: Array<unknown>;
  filter?: (participants: Array<Participant>) => Array<Participant>;
};

/**
 * The ParticipantsLoop component loops over all or a filtered subset of participants to create a visual
 * representation (`ParticipantView`) and context for every participant. This component takes zero or more children.
 * By providing your own `ParticipantView` template as a child you have full control over the look and feel of your
 * participant representations.
 *
 * @remarks
 * If you are looking for a way to loop over camera and screen share tracks use the VideoTrackLoop instead.
 *
 * @example
 * ```tsx
 * {...}
 *   <ParticipantsLoop>
 *     {...}
 *   <ParticipantsLoop />
 * {...}
 * ```
 *
 * @see `ParticipantView` component
 */
export const ParticipantsLoop = ({
  filter,
  filterDependencies,
  ...props
}: React.PropsWithChildren<ParticipantsLoopProps>) => {
  const participants = useParticipants({ filter, filterDependencies });

  return (
    <>
      {participants.map((participant) => (
        <ParticipantContext.Provider value={participant} key={participant.identity}>
          {props.children ? cloneSingleChild(props.children) : <ParticipantView />}
        </ParticipantContext.Provider>
      ))}
    </>
  );
};
