import { Room } from 'livekit-client';
/**
 * @beta
 */
export interface UseTranscriptionsOptions {
    room?: Room;
    participantIdentities?: string[];
    trackSids?: string[];
}
/**
 * @beta
 * useTranscriptions is a hook that returns the transcriptions for the given participant identities and track sids,
 * if no options are provided, it will return all transcriptions
 * @example
 * ```tsx
 * const transcriptions = useTranscriptions();
 * return <div>{transcriptions.map((transcription) => transcription.text)}</div>;
 * ```
 */
export declare function useTranscriptions(opts?: UseTranscriptionsOptions): import('@livekit/components-core').TextStreamData[];
//# sourceMappingURL=useTranscriptions.d.ts.map