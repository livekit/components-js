import type { TrackReference, TrackReferenceOrPlaceholder } from '@livekit/components-core';
import * as React from 'react';
import { TrackContext } from '../context/track-context';
import { cloneSingleChild } from '../utils';
import { getTrackReferenceId } from '@livekit/components-core';

/** @public */
export interface TrackLoopProps {
  /** Track references to loop over. You can the use `useTracks()` hook to get TrackReferences. */
  tracks: TrackReference[] | TrackReferenceOrPlaceholder[];
  /** The template component to be used in the loop. */
  children: React.ReactNode;
}

/**
 * The TrackLoop component loops over tracks. It is for example a easy way to loop over all participant camera and screen share tracks.
 * TrackLoop creates a TrackContext for each track that you can use to e.g. render the track.
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
 * @public
 */
export function TrackLoop({ tracks, ...props }: TrackLoopProps) {
  return (
    <>
      {tracks.map((trackReference) => {
        return (
          <TrackContext.Provider value={trackReference} key={getTrackReferenceId(trackReference)}>
            {cloneSingleChild(props.children)}
          </TrackContext.Provider>
        );
      })}
    </>
  );
}
