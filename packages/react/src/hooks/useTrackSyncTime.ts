import * as React from 'react';
import { trackSyncTimeObserver, type TrackReference } from '@livekit/components-core';
import { useObservableState } from './internal';

/**
 * @internal
 */
export function useTrackSyncTime({ publication }: TrackReference) {
  const observable = React.useMemo(
    () => (publication.track ? trackSyncTimeObserver(publication.track) : undefined),
    [publication.track],
  );
  return useObservableState(observable, {
    timestamp: Date.now(),
    rtpTimestamp: publication.track?.rtpTimestamp,
  });
}
