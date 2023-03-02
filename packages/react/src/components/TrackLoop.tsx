import { isTrackBundle, TrackBundle, TrackBundleWithPlaceholder } from '@livekit/components-core';
import * as React from 'react';
import { ParticipantContext } from '../context';
import { ParticipantTile } from '../prefabs';
import { cloneSingleChild } from '../utils';

type TrackLoopProps = {
  trackBundles: TrackBundle[] | TrackBundleWithPlaceholder[];
};

/**
 * The TrackLoop component loops over tracks. It is for example a easy way to loop over all participant camera and screen share tracks.
 * Only tracks with a the same source specified via the sources property get included in the loop.
 * Further narrowing the loop items is possible by providing a filter function to the component.
 *
 * @example
 * ```tsx
 * const trackBundles = useTracks([Track.Source.Camera]);
 * <TrackLoop trackBundles={trackBundles} >
 * <TrackLoop />
 * ```
 */
export const TrackLoop = ({ trackBundles, ...props }: React.PropsWithChildren<TrackLoopProps>) => {
  return (
    <>
      {trackBundles.map((trackBundle) => {
        const trackSource = isTrackBundle(trackBundle)
          ? trackBundle.publication.source
          : trackBundle.source;
        return (
          <ParticipantContext.Provider
            value={trackBundle.participant}
            key={`${trackBundle.participant.identity}_${trackSource}`}
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
