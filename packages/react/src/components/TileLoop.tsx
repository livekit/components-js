import { isParticipantSourcePinned } from '@livekit/components-core';
import { Track } from 'livekit-client';
import * as React from 'react';
import { ParticipantContext, useMaybeLayoutContext } from '../context';
import { ParticipantFilter, useParticipants, useTracks } from '../hooks';
import { ParticipantTile } from '../prefabs';
import { cloneSingleChild } from '../utils';

interface TileLoopProps {
  sources?: [Track.Source, ...Track.Source[]];
  excludePinnedTracks?: boolean;
  filter?: ParticipantFilter;
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

const defaultSources: [Track.Source, ...Track.Source[]] = [
  Track.Source.Camera,
  Track.Source.ScreenShare,
];

export const TileLoop = ({
  sources = defaultSources,
  excludePinnedTracks = false,
  filter,
  filterDependencies,
  ...props
}: React.PropsWithChildren<TileLoopProps>) => {
  const [mainSource, ...secondarySources] = sources;
  const participants = useParticipants({ filter, filterDependencies });
  const { state: pinState } = useMaybeLayoutContext().pin;

  const secondaryPairs = useTracks({
    sources: secondarySources,
    excludePinnedTracks,
  });

  return (
    <>
      {participants.map((participant) => (
        <ParticipantContext.Provider value={participant} key={participant.identity}>
          {(!excludePinnedTracks ||
            !isParticipantSourcePinned(participant, mainSource, pinState)) && (
            <ParticipantTile trackSource={mainSource} />
          )}

          {secondaryPairs
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
};
