import {
  getTrackReferenceId,
  trackTranscriptionObserver,
  type TrackReference,
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
  const [segments, setSegments] = React.useState<Array<TranscriptionSegment>>([]);
  const currentTrackSyncTime = useTrackSyncTime(trackRef);
  const handleSegmentMessage = React.useCallback(
    (newSegments: TranscriptionSegment[]) => {
      setSegments((prevSegments) =>
        [...prevSegments, ...newSegments]
          .reduceRight((acc, segment) => {
            if (!acc.find((val) => val.id === segment.id)) {
              acc.unshift(segment);
            }
            return acc;
          }, [] as Array<TranscriptionSegment>)
          .slice(0 - opts.windowSize),
      );
    },
    [JSON.stringify(opts)],
  );
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

  const activeSegments = React.useMemo(() => {
    return currentTrackSyncTime
      ? getActiveTranscriptionSegments(segments, currentTrackSyncTime)
      : [];
  }, [currentTrackSyncTime, segments]);

  return { segments, activeSegments };
}

function getActiveTranscriptionSegments(
  segments: TranscriptionSegment[],
  currentTrackTime: number,
) {
  return segments.filter((segment) => {
    const displayStartTime = Math.max(segment.receivedAt, segment.startTime);
    const segmentDuration = segment.endTime - segment.startTime;
    return (
      displayStartTime >= currentTrackTime && displayStartTime + segmentDuration <= currentTrackTime
    );
  });
}
