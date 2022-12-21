import * as React from 'react';
import { ParticipantContext } from '../contexts';
import { useVideoTracks } from '../hooks';
import { cloneSingleChild } from '../utils';
import { ParticipantView } from './participant/ParticipantView';

type VideoTrackLoopProps = {
  /**
   * Set to `true` if screen share tracks should be included in the participant loop?
   */
  includeScreenShares?: boolean;
  excludePinnedTrack?: boolean;
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
export const VideoTrackLoop = ({
  includeScreenShares = true,
  excludePinnedTrack = false,
  ...props
}: React.PropsWithChildren<VideoTrackLoopProps>) => {
  const trackSourceParticipantPairs = useVideoTracks({});

  return (
    <>
      {trackSourceParticipantPairs.map(({ source, participant }) => (
        <ParticipantContext.Provider value={participant} key={participant.identity}>
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
