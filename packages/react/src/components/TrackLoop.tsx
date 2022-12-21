import { Track } from 'livekit-client';
import * as React from 'react';
import { ParticipantContext } from '../contexts';
import { TracksFilter, useTracks } from '../hooks';
import { cloneSingleChild } from '../utils';
import { ParticipantView } from './participant/ParticipantView';

type TrackLoopProps = {
  /**
   * Array of all track sources that should be included as an item in the loop.
   */
  sources: Track.Source[];
  /**
   * Set to `true` if pinned tracks should be included in the participant loop?
   */
  excludePinnedTracks?: boolean;
  filter?: TracksFilter;
  filterDependencies?: Array<any>;
};

/**
 * The VideoTrackLoop component loops over all participant camera and screen share tracks.
 *
 * @example
 * ```tsx
 * {...}
 *   <VideoTrackLoop>
 *     {...}
 *   <VideoTrackLoop />
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
      {trackSourceParticipantPairs.map(({ source, participant }) => (
        <ParticipantContext.Provider value={participant} key={`${participant.identity}_${source}`}>
          {props.children ? (
            cloneSingleChild(props.children)
          ) : (
            <ParticipantView trackSource={source} />
          )}
        </ParticipantContext.Provider>
      ))}
    </>
  );
};
