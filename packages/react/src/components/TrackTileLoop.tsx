import { isTrackParticipantPair, TileFilter } from '@livekit/components-core';
import { Track } from 'livekit-client';
import * as React from 'react';
import { ParticipantContext } from '../context';
import { InputSourceType, useTiles } from '../hooks';
import { ParticipantTile } from '../prefabs';
import { cloneSingleChild } from '../utils';

interface TrackTileLoopProps {
  sources: InputSourceType;
  excludePinnedTracks?: boolean;
  filter?: TileFilter;
  filterDependencies?: [];
}

/**
 * The TrackTileLoop component loops all participants (or a filtered subset) to create a visual
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
 * @example Track loop only shows subscribed tracks.
 * ```tsx
 *   <TrackTileLoop sources=[Track.Source.Camera]>
 *     {...}
 *   <TrackTileLoop />
 * ```
 * @example Loop shows placeholder if participant camera track is not subscribed yet.
 * Screen share track is only visible when subscribed.
 * ```tsx
 *   <TrackTileLoop
 *     sources=[
 *       {source: Track.Source.Camera, withPlaceholder: true},
 *       {source: Track.Source.ScreenShare, withPlaceholder: false}]
 *   />
 * ```
 *
 * @see `ParticipantTile` component
 */
export function TrackTileLoop({
  sources,
  excludePinnedTracks,
  ...props
}: React.PropsWithChildren<TrackTileLoopProps>): React.FunctionComponentElement<
  React.PropsWithChildren<TrackTileLoopProps>
> {
  // const justPairs = useTrackTiles([Track.Source.Camera]);
  // const parisWithPlaceholders = useTrackTiles([
  //   { source: Track.Source.Camera, withPlaceholder: true },
  // ]);
  // console.log(justPairs, parisWithPlaceholders, excludePinnedTracks);
  console.log(excludePinnedTracks);

  const pairsWithPlaceholders = useTiles(sources);

  return (
    <>
      {pairsWithPlaceholders.map((pair) => {
        const trackSource = isTrackParticipantPair(pair) ? pair.track.source : pair.source;
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
