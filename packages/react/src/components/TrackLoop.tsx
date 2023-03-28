import {
  isTrackReference,
  TrackReference,
  TrackReferenceOrPlaceholder,
} from '@livekit/components-core';
import * as React from 'react';
import { TrackContext } from '../context/track-context';
import { ParticipantTile } from '../prefabs';
import { cloneSingleChild } from '../utils';

type TrackLoopProps = {
  tracks: TrackReference[] | TrackReferenceOrPlaceholder[];
};

/**
 * The TrackLoop component loops over tracks. It is for example a easy way to loop over all participant camera and screen share tracks.
 * Only tracks with a the same source specified via the sources property get included in the loop.
 * TrackLoop creates a TrackContext for each track that you can use to e.g. render the track.
 * Further narrowing the loop items is possible by simply filtering the returned array.
 *
 * @example
 * ```tsx
 * const tracks = useTracks([Track.Source.Camera]);
 * <TrackLoop tracks={tracks} >
 *  <TrackContext.Consumer>
 *    {(track) => track && <VideoTrack {...track}/>}
 *  </TrackContext.Consumer>
 * <TrackLoop />
 * ```
 */
export const TrackLoop = ({ tracks, ...props }: React.PropsWithChildren<TrackLoopProps>) => {
  return (
    <>
      {tracks.map((trackReference) => {
        const trackSource = isTrackReference(trackReference)
          ? trackReference.publication.source
          : trackReference.source;
        return (
          <TrackContext.Provider
            value={trackReference}
            key={`${trackReference.participant.identity}_${trackSource}`}
          >
            {props.children ? (
              cloneSingleChild(props.children)
            ) : (
              <ParticipantTile {...trackReference} />
            )}
          </TrackContext.Provider>
        );
      })}
    </>
  );
};
