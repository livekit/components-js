import * as React from 'react';
import { useTextStream } from './useTextStream';
import { DataTopic, ParticipantAgentAttributes } from '@livekit/components-core';
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
export function useTranscriptions(opts?: UseTranscriptionsOptions) {
  const { participantIdentities, trackSids } = opts ?? {};
  const { textStreams } = useTextStream(DataTopic.TRANSCRIPTION, { room: opts?.room });

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
            ? trackSids.includes(
                stream.streamInfo.attributes?.[ParticipantAgentAttributes.TranscribedTrackId] ?? '',
              )
            : true,
        ),
    [textStreams, participantIdentities, trackSids],
  );

  return filteredMessages;
}
