import { useEnsureTrackRef } from '../context';
import type { UseMediaTrackOptions } from './useMediaTrack';
import { useMediaTrackBySourceOrName } from './useMediaTrackBySourceOrName';
import type { TrackReferenceOrPlaceholder } from '@livekit/components-core';

/**
 * @public
 * @deprecated this function will be removed in a future version, use `useTrackByName` instead
 */
export function useMediaTrackByName(
  trackRef?: TrackReferenceOrPlaceholder,
  options: UseMediaTrackOptions = {},
) {
  const ref = useEnsureTrackRef(trackRef);
  return useMediaTrackBySourceOrName(ref, options);
}
