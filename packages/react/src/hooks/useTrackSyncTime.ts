import * as React from 'react';
import { type TrackReferenceOrPlaceholder, trackSyncTimeObserver } from '@livekit/components-core';
import { useObservableState } from './internal';

/**
 * @internal
 */
export function useTrackSyncTime(trackRef?: TrackReferenceOrPlaceholder) {
  const observable = React.useMemo(
    () =>
      trackRef?.publication?.track ? trackSyncTimeObserver(trackRef?.publication.track) : undefined,
    [trackRef?.publication?.track],
  );
  return useObservableState(observable, {
    timestamp: performance.timeOrigin + performance.now(),
    rtpTimestamp: trackRef?.publication?.track?.rtpTimestamp,
  });
}
