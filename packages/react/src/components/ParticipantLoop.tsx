import { Track } from 'livekit-client';
import * as React from 'react';
import { ParticipantContext } from '../context';
import { ParticipantFilter, useParticipants } from '../hooks';
import { cloneSingleChild } from '../utils';
import { ParticipantTile } from './participant/ParticipantTile';

type ParticipantLoopProps = {
  filterDependencies?: Array<unknown>;
  filter?: ParticipantFilter;
};

/**
 * The ParticipantLoop component loops over all or a filtered subset of participants to create a visual
 * representation (`ParticipantTile`) and context for every participant. This component takes zero or more children.
 * By providing your own `ParticipantTile` template as a child you have full control over the look and feel of your
 * participant representations.
 *
 * @remarks
 * If you are looking for a way to loop over camera and screen share tracks use the VideoTrackLoop instead.
 *
 * @example
 * ```tsx
 * {...}
 *   <ParticipantLoop>
 *     {...}
 *   <ParticipantLoop />
 * {...}
 * ```
 *
 * @see `ParticipantTile` component
 */
export const ParticipantLoop = ({
  filter,
  filterDependencies,
  ...props
}: React.PropsWithChildren<ParticipantLoopProps>) => {
  const participants = useParticipants({ filter, filterDependencies });

  return (
    <>
      {participants.map((participant) => (
        <ParticipantContext.Provider value={participant} key={participant.identity}>
          {props.children ? (
            cloneSingleChild(props.children)
          ) : (
            <ParticipantTile trackSource={Track.Source.Camera} />
          )}
        </ParticipantContext.Provider>
      ))}
    </>
  );
};
