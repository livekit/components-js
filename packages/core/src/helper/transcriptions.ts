import type { TranscriptionSegment } from 'livekit-client';

export type ReceivedTranscriptionSegment = TranscriptionSegment & {
  receivedAtMediaTimestamp: number;
};

export function getActiveTranscriptionSegments(
  segments: ReceivedTranscriptionSegment[],
  currentTrackTime: number,
) {
  return segments.filter((segment) => {
    // if a segment arrives late, consider startTime to be the media timestamp from when the segment was received client side
    const displayStartTime = Math.max(segment.receivedAtMediaTimestamp, segment.startTime);
    // "active" duration is computed by the diff between start and end time, so we don't rely on displayStartTime to always be the same as the segment's startTime
    const segmentDuration = segment.endTime - segment.startTime;
    return (
      displayStartTime >= currentTrackTime && displayStartTime + segmentDuration <= currentTrackTime
    );
  });
}

export function addMediaTimestampToTranscription(
  segment: TranscriptionSegment,
  timestamp: number,
): ReceivedTranscriptionSegment {
  return { ...segment, receivedAtMediaTimestamp: timestamp };
}

/**
 * @returns An array of unique (by id) `TranscriptionSegment`s. Latest wins.
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
    prevActive.find(
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
