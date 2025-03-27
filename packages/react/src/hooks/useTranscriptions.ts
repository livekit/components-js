import * as React from 'react';
import { useTextStream } from './useTextStream';
import { DataTopic } from '@livekit/components-core';

/**
 * @beta
 */
export interface UseTranscriptionsOptions {
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
export function useTranscriptions(opts?: UseTranscriptionsOptions) {
  const { participantIdentities, trackSids } = opts ?? {};
  const { textStreams } = useTextStream(DataTopic.TRANSCRIPTION);

  const filteredMessages = React.useMemo(
    () =>
      textStreams
        .filter((stream) =>
          participantIdentities
            ? participantIdentities.includes(stream.participantInfo.identity)
            : true,
        )
        .filter((stream) =>
          trackSids
            ? trackSids.includes(stream.streamInfo.attributes?.['lk.transcribed_track_id'] ?? '')
            : true,
        ),
    [textStreams, participantIdentities, trackSids],
  );

  return filteredMessages;
}
