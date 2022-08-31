import type { Participant, Track } from 'livekit-client';
import { observeParticipantMedia } from '../observables/participant';
import { getCSSClassName } from '../utils';

export function setupParticipantMedia(source: Track.Source) {
  console.log('setup participant media');
  const mediaListener = (
    participant: Participant,
    onParticipantMediaChange: (participant: Participant) => void,
  ) => {
    const listener = observeParticipantMedia(participant).subscribe((p) => {
      console.log('participant media changed');
      onParticipantMediaChange(p);
    });

    onParticipantMediaChange(participant);

    return () => listener.unsubscribe();
  };

  return { className: getCSSClassName(`participant-media-${source}`), mediaListener };
}
