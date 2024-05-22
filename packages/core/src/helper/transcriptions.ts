import type { TranscriptionSegment } from 'livekit-client';

export type ReceivedTranscriptionSegment = TranscriptionSegment & {
  receivedAtMediaTimestamp: number;
  receivedAt: number;
};

export function getActiveTranscriptionSegments(
  segments: ReceivedTranscriptionSegment[],
  syncTimes: { timestamp: number; rtpTimestamp?: number },
  maxAge = 0,
) {
  return segments.filter((segment) => {
    const hasTrackSync = !!syncTimes.rtpTimestamp;
    const currentTrackTime = syncTimes.rtpTimestamp ?? performance.timeOrigin + performance.now();
    // if a segment arrives late, consider startTime to be the media timestamp from when the segment was received client side
    const displayStartTime = hasTrackSync
      ? Math.max(segment.receivedAtMediaTimestamp, segment.startTime)
      : segment.receivedAt;
    // "active" duration is computed by the diff between start and end time, so we don't rely on displayStartTime to always be the same as the segment's startTime
    const segmentDuration = maxAge + segment.endTime - segment.startTime;
    return (
      currentTrackTime >= displayStartTime && currentTrackTime <= displayStartTime + segmentDuration
    );
  });
}

export function addMediaTimestampToTranscription(
  segment: TranscriptionSegment,
  timestamps: { timestamp: number; rtpTimestamp?: number },
): ReceivedTranscriptionSegment {
  return {
    ...segment,
    receivedAtMediaTimestamp: timestamps.rtpTimestamp ?? 0,
    receivedAt: timestamps.timestamp,
  };
}

/**
 * @returns An array of unique (by id) `TranscriptionSegment`s. Latest wins. If the resulting array would be longer than `windowSize`, the array will be reduced to `windowSize` length
 */
export function dedupeSegments<T extends TranscriptionSegment>(
  prevSegments: T[],
  newSegments: T[],
  windowSize: number,
) {
  return [...prevSegments, ...newSegments]
    .reduceRight((acc, segment) => {
      if (!acc.find((val) => val.id === segment.id)) {
        acc.unshift(segment);
      }
      return acc;
    }, [] as Array<T>)
    .slice(0 - windowSize);
}

export function didActiveSegmentsChange<T extends TranscriptionSegment>(
  prevActive: T[],
  newActive: T[],
) {
  if (newActive.length !== prevActive.length) {
    return true;
  }
  return !newActive.every((newSegment) => {
    return prevActive.find(
      (prevSegment) =>
        prevSegment.id === newSegment.id &&
        prevSegment.text === newSegment.text &&
        prevSegment.final === newSegment.final &&
        prevSegment.language === newSegment.language &&
        prevSegment.startTime === newSegment.startTime &&
        prevSegment.endTime === newSegment.endTime,
    );
  });
}
