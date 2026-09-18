import * as React from 'react';
import { type TrackReferenceOrPlaceholder, trackSyncTimeObserver } from '@livekit/components-core';
import { useObservableState } from './internal';

/**
 * @internal
 * @deprecated this is an internal hook that's only used by deprecated APIs
 */
export function useTrackSyncTime(ref: TrackReferenceOrPlaceholder | undefined) {
  const observable = React.useMemo(
    () => (ref?.publication?.track ? trackSyncTimeObserver(ref?.publication.track) : undefined),
    [ref?.publication?.track],
  );
  return useObservableState(observable, {
    timestamp: Date.now(),
    rtpTimestamp: ref?.publication?.track?.rtpTimestamp,
  });
}
