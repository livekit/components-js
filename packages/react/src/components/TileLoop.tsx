import { isTrackParticipantPair, MaybeTrackParticipantPair } from '@livekit/components-core';
import * as React from 'react';
import { ParticipantContext } from '../context';
import { ParticipantTile } from '../prefabs';
import { cloneSingleChild } from '../utils';

interface TileLoopProps {
  tiles: MaybeTrackParticipantPair[];
}

/**
 * The TileLoop component loops all tiles to create a visual representation (`ParticipantTile`) with a `ParticipantContext`.
 * This component takes zero or more children. By providing your own `ParticipantTile` template as a child you have full
 * control over the look and feel of your participant representations.
 *
 * @example
 * ```tsx
 *   const tiles = useTiles([Track.Source.Camera]);
 *   <TileLoop tiles={tiles}>
 *     {...}
 *   <TileLoop />
 * ```
 * @see `ParticipantTile` component
 */
export function TileLoop({
  tiles,
  ...props
}: React.PropsWithChildren<TileLoopProps>): React.FunctionComponentElement<
  React.PropsWithChildren<TileLoopProps>
> {
  return (
    <>
      {tiles.map((pair) => {
        const trackSource = isTrackParticipantPair(pair) ? pair.track.source : pair.source;
        return (
          <ParticipantContext.Provider
            value={pair.participant}
            key={`${pair.participant.identity}_${trackSource}`}
          >
            {props.children ? (
              cloneSingleChild(props.children, { trackSource })
            ) : (
              <ParticipantTile trackSource={trackSource} />
            )}
          </ParticipantContext.Provider>
        );
      })}
    </>
  );
}
