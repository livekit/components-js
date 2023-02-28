import {
  InputSourceType,
  isParticipantTrackPinned,
  isTrackParticipantPair,
  TileFilter,
} from '@livekit/components-core';
import * as React from 'react';
import { ParticipantContext, useMaybeLayoutContext } from '../context';
import { useTiles } from '../hooks';
import { ParticipantTile } from '../prefabs';
import { cloneSingleChild } from '../utils';

interface TileLoopProps {
  sources: InputSourceType;
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
 * @example Track loop only shows subscribed tracks.
 * ```tsx
 *   <TileLoop sources=[Track.Source.Camera]>
 *     {...}
 *   <TileLoop />
 * ```
 * @example Loop shows placeholder if participant camera track is not subscribed yet.
 * Screen share track is only visible when subscribed.
 * ```tsx
 *   <TileLoop
 *     sources={[
 *       {source: Track.Source.Camera, withPlaceholder: true},
 *       {source: Track.Source.ScreenShare, withPlaceholder: false}]}
 *   />
 * ```
 *
 * @see `ParticipantTile` component
 */
export function TileLoop({
  sources,
  excludePinnedTracks = true,
  ...props
}: React.PropsWithChildren<TileLoopProps>): React.FunctionComponentElement<
  React.PropsWithChildren<TileLoopProps>
> {
  const layoutContext = useMaybeLayoutContext();
  const pairsWithPlaceholders = useTiles(sources);

  return (
    <>
      {pairsWithPlaceholders
        .filter((pair) => {
          if (
            excludePinnedTracks === false ||
            !layoutContext?.pin.state ||
            !isTrackParticipantPair(pair)
          ) {
            return true;
          } else {
            return !isParticipantTrackPinned(pair, layoutContext.pin.state);
          }
        })
        .map((pair) => {
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
