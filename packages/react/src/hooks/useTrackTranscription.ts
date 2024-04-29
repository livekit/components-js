import type { RemoteTrackPublication, TranscriptionSegment } from 'livekit-client';
import {
  type TrackReferenceOrPlaceholder,
  getTrackReferenceId,
  trackTranscriptionObserver,
} from '@livekit/components-core';
import * as React from 'react';

/**
 * @alpha
 */
export function useTrackTranscription(
  trackRef: TrackReferenceOrPlaceholder,
  onTranscription?: (
    segments: TranscriptionSegment[],
    publication?: RemoteTrackPublication,
  ) => void,
) {
  React.useEffect(() => {
    if (!trackRef.publication) {
      return;
    }
    const subscription = trackTranscriptionObserver(trackRef.publication).subscribe((evt) => {
      onTranscription?.(...evt);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [getTrackReferenceId(trackRef), onTranscription]);
}
