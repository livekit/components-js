import type { TrackIdentifier } from '@livekit/components-core';
import type * as React from 'react';
import { useMediaTrackBySourceOrName } from './useMediaTrackBySourceOrName';

/** @public */
export interface UseTrackOptions {
  element?: React.RefObject<HTMLMediaElement>;
  props?: React.HTMLAttributes<HTMLVideoElement | HTMLAudioElement>;
}

/** @public */
export function useTrack(trackRef: TrackIdentifier, options: UseTrackOptions = {}) {
  return useMediaTrackBySourceOrName(trackRef, options);
}
