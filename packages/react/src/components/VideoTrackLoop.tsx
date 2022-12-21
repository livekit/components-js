import * as React from 'react';
import { ParticipantContext } from '../contexts';
import { useVideoTracks } from '../hooks';
import { cloneSingleChild } from '../utils';
import { ParticipantView } from './participant/ParticipantView';

type VideoTrackLoopProps = {
  /**
   * Set to `true` if screen share tracks should be included in the participant loop?
   */
  includeScreenShareTracks?: boolean;
  excludePinnedTracks?: boolean;
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
  includeScreenShareTracks = true,
  excludePinnedTracks = false,
  ...props
}: React.PropsWithChildren<VideoTrackLoopProps>) => {
  const trackSourceParticipantPairs = useVideoTracks({
    includeScreenShareTracks,
    excludePinnedTracks,
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
