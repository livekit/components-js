import {
  type ReceivedTranscriptionSegment,
  addMediaTimestampToTranscription,
  dedupeSegments,
  getActiveTranscriptionSegments,
  getTrackReferenceId,
  trackTranscriptionObserver,
  type TrackReference,
  didActiveSegmentsChange,
} from '@livekit/components-core';
import type { TranscriptionSegment } from 'livekit-client';
import * as React from 'react';
import { useTrackSyncTime } from './useTrackSyncTime';

export interface TrackTranscriptionOptions {
  // how many transcription segments should be buffered in state
  windowSize?: number;
}

const TRACK_TRANSCRIPTION_DEFAULTS = {
  windowSize: 100,
} as const satisfies TrackTranscriptionOptions;

/**
 * @alpha
 * @returns An object consisting of `segments` with maximum length of opts.windowLength and `activeSegments` that are valid for the current track timestamp
 */
export function useTrackTranscription(
  trackRef: TrackReference,
  options: TrackTranscriptionOptions,
) {
  const opts = { ...TRACK_TRANSCRIPTION_DEFAULTS, ...options };
  const [segments, setSegments] = React.useState<Array<ReceivedTranscriptionSegment>>([]);
  const [activeSegments, setActiveSegments] = React.useState<Array<ReceivedTranscriptionSegment>>(
    [],
  );
  const prevActiveSegments = React.useRef<ReceivedTranscriptionSegment[]>([]);
  const currentTrackSyncTime = useTrackSyncTime(trackRef);
  const handleSegmentMessage = (newSegments: TranscriptionSegment[]) => {
    setSegments((prevSegments) =>
      dedupeSegments(
        prevSegments,
        // when first receiving a segment, add the current media timestamp to it
        newSegments.map((s) => addMediaTimestampToTranscription(s, currentTrackSyncTime ?? 0)),
        opts.windowSize,
      ),
    );
  };
  React.useEffect(() => {
    if (!trackRef.publication) {
      return;
    }
    const subscription = trackTranscriptionObserver(trackRef.publication).subscribe((evt) => {
      handleSegmentMessage(...evt);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [getTrackReferenceId(trackRef), handleSegmentMessage]);

  React.useEffect(() => {
    if (currentTrackSyncTime) {
      const newActiveSegments = getActiveTranscriptionSegments(segments, currentTrackSyncTime);
      // only update active segment array if content actually changed
      if (didActiveSegmentsChange(prevActiveSegments.current, newActiveSegments)) {
        setActiveSegments(newActiveSegments);
        prevActiveSegments.current = newActiveSegments;
      }
    }
  }, [currentTrackSyncTime, segments]);

  return { segments, activeSegments };
}
