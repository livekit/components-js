import { Track } from 'livekit-client';
import * as React from 'react';
import { ParticipantContext } from '../context';
import { TracksFilter, useTracks } from '../hooks';
import { cloneSingleChild } from '../utils';
import { ParticipantTile } from './participant/ParticipantTile';

type TrackLoopProps = {
  /**
   * Array of all track sources that should be included as an item in the loop.
   */
  sources: [Track.Source, ...Track.Source[]];
  /**
   * Set to `true` if pinned tracks should be included in the participant loop?
   */
  excludePinnedTracks?: boolean;
  filter?: TracksFilter;
  filterDependencies?: Array<any>;
};

/**
 * The TrackLoop component loops over tracks. It is for example a easy way to loop over all participant camera and screen share tracks.
 * Only tracks with a the same source specified via the sources property get included in the loop.
 * Further narrowing the loop items is possible by providing a filter function to the component.
 *
 * @example
 * ```tsx
 * {...}
 *   <TrackLoop sources=[Track.Source.Camera, Track.Source.ScreenShare]>
 *     {...}
 *   <TrackLoop />
 * {...}
 * ```
 */
export const TrackLoop = ({
  sources = [Track.Source.Camera],
  excludePinnedTracks = false,
  filter,
  filterDependencies,
  ...props
}: React.PropsWithChildren<TrackLoopProps>) => {
  const trackSourceParticipantPairs = useTracks({
    sources,
    excludePinnedTracks,
    filter,
    filterDependencies,
  });

  return (
    <>
      {trackSourceParticipantPairs.map(({ track, participant }) => (
        <ParticipantContext.Provider
          value={participant}
          key={`${participant.identity}_${track.source}`}
        >
          {props.children ? (
            cloneSingleChild(props.children)
          ) : (
            <ParticipantTile trackSource={track.source} />
          )}
        </ParticipantContext.Provider>
      ))}
    </>
  );
};
