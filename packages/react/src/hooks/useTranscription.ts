import type { RemoteParticipant, RemoteTrackPublication, Transcription } from 'livekit-client';
import { createTranscriptionObserver } from '@livekit/components-core';
import * as React from 'react';
import { useRoomContext } from '../context';

/**
 * @alpha
 */
export function useTranscription(
  onTranscription: (
    transcription: Transcription,
    participant?: RemoteParticipant,
    publication?: RemoteTrackPublication,
  ) => void,
) {
  const room = useRoomContext();
  React.useEffect(() => {
    const subscription = createTranscriptionObserver(room).subscribe((evt) => {
      onTranscription(...evt);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [room, onTranscription]);
}
