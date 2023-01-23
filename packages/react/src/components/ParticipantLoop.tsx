import { ParticipantFilter } from '@livekit/components-core';
import { Track } from 'livekit-client';
import * as React from 'react';
import { ParticipantContext } from '../context';
import { useParticipants } from '../hooks';
import { ParticipantTile } from '../prefabs';
import { cloneSingleChild } from '../utils';

type ParticipantLoopProps = {
  filterDependencies?: Array<unknown>;
  filter?: ParticipantFilter;
};

/**
 * The ParticipantLoop component loops over all or a filtered subset of participants to create a visual
 * representation and context for every participant. This component takes zero or more children.
 * By providing your own template as a child you have full control over the look and feel of your
 * participant representations.
 * You could use this for example to create a list of participants.
 *
 * @remarks
 * If you are looking for a way to have tiles for each participant that work for all video tracks at the same time out of the box
 * have a look at the `TileLoop`.
 *
 * @example
 * ```tsx
 * {...}
 *   <ParticipantLoop>
 *     <ParticipantName />
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
