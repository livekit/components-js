import {
  isTrackReference,
  TrackReference,
  TrackReferenceOrPlaceholder,
} from '@livekit/components-core';
import * as React from 'react';
import { ParticipantContext } from '../context';
import { ParticipantTile } from '../prefabs';
import { cloneSingleChild } from '../utils';

type TrackLoopProps = {
  tracks: TrackReference[] | TrackReferenceOrPlaceholder[];
};

/**
 * The TrackLoop component loops over tracks. It is for example a easy way to loop over all participant camera and screen share tracks.
 * Only tracks with a the same source specified via the sources property get included in the loop.
 * Further narrowing the loop items is possible by providing a filter function to the component.
 *
 * @example
 * ```tsx
 * const tracks = useTracks([Track.Source.Camera]);
 * <TrackLoop tracks={tracks} >
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
          <ParticipantContext.Provider
            value={trackReference.participant}
            key={`${trackReference.participant.identity}_${trackSource}`}
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
};
