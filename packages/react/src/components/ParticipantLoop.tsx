import type { ParticipantFilter } from '@livekit/components-core';
import type { RoomEvent } from 'livekit-client';
import { Track } from 'livekit-client';
import * as React from 'react';
import { ParticipantContext } from '../context';
import { useParticipants } from '../hooks';
import { ParticipantTile } from '../prefabs';
import { cloneSingleChild } from '../utils';

type ParticipantLoopProps = {
  filter?: ParticipantFilter;
  /**
   * If your filter function is dependent on some external state, and you want it to be re-filtered
   * whenever that external state changes, you will need to provide a dependency array with all of
   * the external dependencies, just as you would on a React useEffect hook.
   */
  filterDependencies?: Array<unknown>;
  /**
   * To optimize performance, you can use the updateOnlyOn property to decide on
   * what RoomEvents the hook updates. By default it updates on all relevant RoomEvents
   * to keep the returned participants array up to date.
   * The minimal set of non-overwriteable RoomEvents is: [RoomEvent.ParticipantConnected, RoomEvent.ParticipantDisconnected, RoomEvent.ConnectionStateChanged]
   */
  updateOnlyOn?: RoomEvent[];
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
  updateOnlyOn = [],
  ...props
}: React.PropsWithChildren<ParticipantLoopProps>) => {
  const participants = useParticipants({
    updateOnlyOn: filter && updateOnlyOn.length === 0 ? undefined : updateOnlyOn,
  });
  const filterDependenciesArray = filterDependencies ?? [];
  const filteredParticipants = React.useMemo(() => {
    return filter ? participants.filter(filter) : participants;
  }, [participants, filter, ...filterDependenciesArray]);

  return (
    <>
      {filteredParticipants.map((participant) => (
        <ParticipantContext.Provider value={participant} key={participant.identity}>
          {props.children ? (
            cloneSingleChild(props.children)
          ) : (
            <ParticipantTile source={Track.Source.Camera} />
          )}
        </ParticipantContext.Provider>
      ))}
    </>
  );
};
