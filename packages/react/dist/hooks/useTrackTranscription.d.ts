import { ReceivedTranscriptionSegment, TrackReferenceOrPlaceholder } from '@livekit/components-core';
import { TranscriptionSegment } from 'livekit-client';
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
}
/**
 * @returns An object consisting of `segments` with maximum length of opts.bufferSize
 * @alpha
 * @deprecated Use useTranscription instead
 */
export declare function useTrackTranscription(trackRef: TrackReferenceOrPlaceholder | undefined, options?: TrackTranscriptionOptions): {
    segments: ReceivedTranscriptionSegment[];
};
//# sourceMappingURL=useTrackTranscription.d.ts.map