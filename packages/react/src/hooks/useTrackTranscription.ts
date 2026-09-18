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
 * @deprecated Use useTranscription instead
 */
export interface TrackTranscriptionOptions {
  /**
   * how many transcription segments should be buffered in state
   * @defaultValue 100
   */
  bufferSize?: number;
  /**
   * optional callback for retrieving newly incoming transcriptions only
   */
  onTranscription?: (newSegments: TranscriptionSegment[]) => void;
  /** amount of time (in ms) that the segment is considered `active` past its original segment duration, defaults to 2_000 */
  // maxAge?: number;
}

const TRACK_TRANSCRIPTION_DEFAULTS = {
  bufferSize: 100,
  // maxAge: 2_000,
} as const satisfies TrackTranscriptionOptions;

/**
 * @returns An object consisting of `segments` with maximum length of opts.bufferSize
 * @alpha
 * @deprecated Use useTranscription instead
 */
export function useTrackTranscription(
  trackRef: TrackReferenceOrPlaceholder | undefined,
  options?: TrackTranscriptionOptions,
) {
  const opts = { ...TRACK_TRANSCRIPTION_DEFAULTS, ...options };
  const [segments, setSegments] = React.useState<Array<ReceivedTranscriptionSegment>>([]);

  const syncTimestamps = useTrackSyncTime(trackRef);
  const handleSegmentMessage = (newSegments: TranscriptionSegment[]) => {
    opts.onTranscription?.(newSegments);
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
    if (!trackRef?.publication) {
      return;
    }
    const subscription = trackTranscriptionObserver(trackRef.publication).subscribe((evt) => {
      handleSegmentMessage(...evt);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [trackRef && getTrackReferenceId(trackRef), handleSegmentMessage]);

  return { segments };
}
