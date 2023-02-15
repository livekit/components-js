import {
  isParticipantSourcePinned,
  isParticipantTrackPinned,
  ParticipantFilter,
  TrackParticipantPair,
} from '@livekit/components-core';
import { Track } from 'livekit-client';
import * as React from 'react';
import { ParticipantContext, useMaybeLayoutContext } from '../context';
import { useParticipants, useTracks } from '../hooks';
import { ParticipantTile } from '../prefabs';
import { cloneSingleChild } from '../utils';

interface TileLoopProps {
  sources?: [Track.Source, ...Track.Source[]];
  excludePinnedTracks?: boolean;
  filter?: ParticipantFilter;
  filterDependencies?: [];
}

const DefaultTileLoopProps = {
  sources: [Track.Source.Camera, Track.Source.ScreenShare],
} satisfies TileLoopProps;

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
  filterDependencies = [],
  ...props
}: React.PropsWithChildren<TileLoopProps>): React.FunctionComponentElement<
  React.PropsWithChildren<TileLoopProps>
> {
  const [mainSource] = React.useState(sources ? sources[0] : DefaultTileLoopProps.sources[0]);
  const [secondarySources] = React.useState(
    sources ? sources.slice(1) : DefaultTileLoopProps.sources.slice(1),
  );
  const participants = useParticipants({ updateOnlyOn: [] });
  const filteredParticipants = React.useMemo(() => {
    return filter ? participants.filter(filter) : participants;
  }, [filter, participants, ...filterDependencies]);
  const layoutContext = useMaybeLayoutContext();

  const secondaryPairs = useTracks(secondarySources);
  const filteredSecondaryPairs = React.useMemo(() => {
    let tempPairs: TrackParticipantPair[] = secondaryPairs;
    if (excludePinnedTracks && layoutContext?.pin?.state) {
      const pinState = layoutContext.pin.state;
      tempPairs = tempPairs.filter((pair) => !isParticipantTrackPinned(pair, pinState));
    }
    return tempPairs;
  }, [excludePinnedTracks, layoutContext, secondaryPairs]);

  return (
    <>
      {filteredParticipants.map((participant) => (
        <ParticipantContext.Provider value={participant} key={participant.identity}>
          {(!excludePinnedTracks ||
            !isParticipantSourcePinned(participant, mainSource, layoutContext?.pin.state)) && (
            <ParticipantTile trackSource={mainSource} />
          )}

          {filteredSecondaryPairs
            .filter(({ participant: p }) => p.identity === participant.identity)
            .map(({ track }, index) =>
              props.children ? (
                cloneSingleChild(props.children, { trackSource: track.source }, index)
              ) : (
                <ParticipantTile key={index} trackSource={track.source} />
              ),
            )}
        </ParticipantContext.Provider>
      ))}
    </>
  );
}
