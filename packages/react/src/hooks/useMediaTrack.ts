import { VideoSource, AudioSource } from '@livekit/components-core';
import { UseMediaTrackOptions, useMediaTrackBySourceOrName } from './useMediaTrackBySourceOrName';

export function useMediaTrack(
  source: VideoSource | AudioSource,
  options: UseMediaTrackOptions = {},
) {
  return useMediaTrackBySourceOrName({ source }, options);
}
