import { isParticipantSourcePinned } from '@livekit/components-core';
import { Track } from 'livekit-client';
import * as React from 'react';
import { ParticipantContext, useMaybePinContext } from '../contexts';
import { useParticipants, useTracks } from '../hooks';
import { cloneSingleChild } from '../utils';
import { ParticipantTile } from './participant/ParticipantTile';

type TileLoopProps = {
  //   participants: Participant[];
  mainSource?: Track.Source;
  secondarySources?: Track.Source[];
  excludePinnedTracks?: boolean;
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

const secondarySourcesDefault = [Track.Source.ScreenShare];
export const TileLoop = ({
  mainSource = Track.Source.Camera,
  secondarySources = [Track.Source.ScreenShare],
  excludePinnedTracks,
}: React.PropsWithChildren<TileLoopProps>) => {
  const participants = useParticipants();
  const { state: pinState } = useMaybePinContext();

  const secondaryPairs = useTracks({
    sources: secondarySources ?? secondarySourcesDefault,
    excludePinnedTracks: false,
  });

  React.useEffect(() => {
    console.log(mainSource, secondarySources);
  }, [mainSource, secondarySources]);

  return (
    <>
      {participants.map((participant) => (
        <ParticipantContext.Provider value={participant} key={participant.identity}>
          {(!excludePinnedTracks ||
            !isParticipantSourcePinned(participant, mainSource, pinState)) && (
            <ParticipantTile trackSource={mainSource} />
          )}

          {/* {secondaryPairs
            .filter(({ participant: p }) => p.identity === participant.identity)
            .map(({ track }, index) =>
              props.children ? (
                cloneSingleChild(props.children, { trackSource: track.source }, index)
              ) : (
                <ParticipantTile key={index} trackSource={track.source} />
              ),
            )} */}
        </ParticipantContext.Provider>
      ))}
    </>
  );
};
