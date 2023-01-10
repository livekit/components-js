import { isParticipantSourcePinned } from '@livekit/components-core';
import { Track } from 'livekit-client';
import * as React from 'react';
import { ParticipantContext, useMaybeLayoutContext } from '../context';
import { useParticipants, useTracks } from '../hooks';
import { ParticipantTile } from '../prefabs';
import { cloneSingleChild } from '../utils';

interface TileLoopProps {
  //   participants: Participant[];
  mainSource?: Track.Source;
  secondarySources?: Track.Source[];
  excludePinnedTracks?: boolean;
}

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

const TileLoopDefaults = {
  mainSource: Track.Source.Camera,
  secondarySources: [Track.Source.ScreenShare],
};

export const TileLoop = ({
  mainSource,
  secondarySources,
  excludePinnedTracks,
  ...props
}: React.PropsWithChildren<TileLoopProps>) => {
  mainSource ??= TileLoopDefaults.mainSource;
  secondarySources ??= TileLoopDefaults.secondarySources;
  excludePinnedTracks ??= false;
  const participants = useParticipants();
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
            !isParticipantSourcePinned(
              participant,
              mainSource ?? TileLoopDefaults.mainSource,
              pinState,
            )) && <ParticipantTile trackSource={mainSource} />}

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
