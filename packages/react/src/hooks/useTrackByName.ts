import { useEnsureTrackRef } from '../context';
import type { UseMediaTrackOptions } from './useMediaTrack';
import { useMediaTrackBySourceOrName } from './useMediaTrackBySourceOrName';
import type { TrackReferenceOrPlaceholder } from '@livekit/components-core';

/**
 * @public
 */
export function useTrackByName(
  trackRef?: TrackReferenceOrPlaceholder,
  options: UseMediaTrackOptions = {},
) {
  const ref = useEnsureTrackRef(trackRef);
  return useMediaTrackBySourceOrName(ref, options);
}
