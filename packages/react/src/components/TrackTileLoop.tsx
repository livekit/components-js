import { isTrackParticipantPair, TileFilter } from '@livekit/components-core';
import { Track } from 'livekit-client';
import * as React from 'react';
import { ParticipantContext } from '../context';
import { useTiles, useTrackTiles } from '../hooks';
import { ParticipantTile } from '../prefabs';
import { cloneSingleChild } from '../utils';

interface TileLoopProps {
  sources?: [Track.Source, ...Track.Source[]];
  excludePinnedTracks?: boolean;
  filter?: TileFilter;
  filterDependencies?: [];
}

/**
 * The TileLoop component loops all participants (or a filtered subset) to create a visual
 * representation (`ParticipantTile`) and context for every participant. This component takes zero or more children.
 * By providing your own `ParticipantTile` template as a child you have full control over the look and feel of your
 * participant representations.
 *
 * The first element of the sources array will always create a participant tile. The following sources will only show up
 * if there's a track present for that source. This makes it possible for a ParticipantTile to always show up also
 * when a participant hasn't yet published a camera track.
 *
 * @remarks
 * If you are looking for a way to loop over tracks more granularly use the TrackLoop instead.
 *
 * @example
 * ```tsx
 * {...}
 *   <TileLoop>
 *     {...}
 *   <TileLoop />
 * {...}
 * ```
 *
 * @see `ParticipantTile` component
 */
export function TileLoop({
  sources,
  excludePinnedTracks,
  filter,
  filterDependencies,
  ...props
}: React.PropsWithChildren<TileLoopProps>): React.FunctionComponentElement<
  React.PropsWithChildren<TileLoopProps>
> {
  const justPairs = useTrackTiles([Track.Source.Camera]);
  const parisWithPlaceholders = useTrackTiles([
    { source: Track.Source.Camera, withPlaceholder: true },
  ]);

  console.log(justPairs, parisWithPlaceholders);

  const pairsWithPlaceholders = useTiles({
    sources: sources ? sources : [Track.Source.Camera],
    excludePinnedTracks,
    filter,
    filterDependencies,
  });

  return (
    <>
      {pairsWithPlaceholders.map((pair) => {
        const trackSource = isTrackParticipantPair(pair) ? pair.track.source : Track.Source.Camera;
        return (
          <ParticipantContext.Provider
            value={pair.participant}
            key={`${pair.participant.identity}_${trackSource}`}
          >
            {props.children ? (
              cloneSingleChild(props.children)
            ) : (
              <ParticipantTile trackSource={trackSource} />
            )}
          </ParticipantContext.Provider>
        );
      })}
    </>
  );
}
