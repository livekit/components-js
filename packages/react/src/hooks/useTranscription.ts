import * as React from 'react';
import { useTextStream } from './useTextStream';

export interface UseTranscriptionsOptions {
  participantIdentities?: string[];
  trackSids?: string[];
}

export function useTranscriptions(opts: UseTranscriptionsOptions) {
  const { participantIdentities, trackSids } = opts;
  const { textStreams } = useTextStream('lk.transcription');

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
