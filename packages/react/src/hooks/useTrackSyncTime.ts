import * as React from 'react';
import { type TrackReferenceOrPlaceholder, trackSyncTimeObserver } from '@livekit/components-core';
import { useObservableState } from './internal';

/**
 * @internal
 */
export function useTrackSyncTime({ publication }: TrackReferenceOrPlaceholder) {
  const observable = React.useMemo(
    () => (publication?.track ? trackSyncTimeObserver(publication.track) : undefined),
    [publication?.track],
  );
  return useObservableState(observable, {
    timestamp: Date.now(),
    rtpTimestamp: publication?.track?.rtpTimestamp,
  });
}
