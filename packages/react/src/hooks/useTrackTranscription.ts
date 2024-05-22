import {
  type ReceivedTranscriptionSegment,
  addMediaTimestampToTranscription as addTimestampsToTranscription,
  dedupeSegments,
  // getActiveTranscriptionSegments,
  getTrackReferenceId,
  trackTranscriptionObserver,
  type TrackReferenceOrPlaceholder,
  // didActiveSegmentsChange,
} from '@livekit/components-core';
import type { TranscriptionSegment } from 'livekit-client';
import * as React from 'react';
import { useTrackSyncTime } from './useTrackSyncTime';

/**
 * @alpha
 */
export interface TrackTranscriptionOptions {
  /**
   * how many transcription segments should be buffered in state
   * @defaultValue 100
   */
  bufferSize?: number;
  /** amount of time (in ms) that the segment is considered `active` past its original segment duration, defaults to 2_000 */
  // maxAge?: number;
}

const TRACK_TRANSCRIPTION_DEFAULTS = {
  bufferSize: 100,
  // maxAge: 2_000,
} as const satisfies TrackTranscriptionOptions;

/**
 * @returns An object consisting of `segments` with maximum length of opts.windowLength and `activeSegments` that are valid for the current track timestamp
 * @alpha
 */
export function useTrackTranscription(
  trackRef: TrackReferenceOrPlaceholder,
  options?: TrackTranscriptionOptions,
) {
  const opts = { ...TRACK_TRANSCRIPTION_DEFAULTS, ...options };
  const [segments, setSegments] = React.useState<Array<ReceivedTranscriptionSegment>>([]);
  // const [activeSegments, setActiveSegments] = React.useState<Array<ReceivedTranscriptionSegment>>(
  //   [],
  // );
  // const prevActiveSegments = React.useRef<ReceivedTranscriptionSegment[]>([]);
  const syncTimestamps = useTrackSyncTime(trackRef);
  const handleSegmentMessage = (newSegments: TranscriptionSegment[]) => {
    setSegments((prevSegments) =>
      dedupeSegments(
        prevSegments,
        // when first receiving a segment, add the current media timestamp to it
        newSegments.map((s) => addTimestampsToTranscription(s, syncTimestamps)),
        opts.bufferSize,
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

  // React.useEffect(() => {
  //   if (syncTimestamps) {
  //     const newActiveSegments = getActiveTranscriptionSegments(
  //       segments,
  //       syncTimestamps,
  //       opts.maxAge,
  //     );
  //     // only update active segment array if content actually changed
  //     if (didActiveSegmentsChange(prevActiveSegments.current, newActiveSegments)) {
  //       setActiveSegments(newActiveSegments);
  //       prevActiveSegments.current = newActiveSegments;
  //     }
  //   }
  // }, [syncTimestamps, segments, opts.maxAge]);

  return { segments };
}
