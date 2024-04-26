import type { Participant, RemoteTrackPublication, Transcription } from 'livekit-client';
import { participantTranscriptionObserver } from '@livekit/components-core';
import * as React from 'react';

/**
 * @alpha
 */
export function useParticipantTranscription(
  participant: Participant,
  onTranscription: (transcription: Transcription, publication?: RemoteTrackPublication) => void,
) {
  React.useEffect(() => {
    const subscription = participantTranscriptionObserver(participant).subscribe((evt) => {
      onTranscription(...evt);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [participant, onTranscription]);
}
