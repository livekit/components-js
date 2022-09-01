import type { Participant, Track, TrackPublication } from 'livekit-client';
import { observeParticipantMedia } from '../observables/participant';
import { getCSSClassName } from '../utils';

export function setupParticipantMedia(source: Track.Source) {
  console.log('setup participant media');
  const mediaListener = (
    participant: Participant,
    onParticipantMediaChange: (publication: TrackPublication | undefined) => void,
    element?: HTMLMediaElement | null,
  ) => {
    const handleAttachment = (publication: TrackPublication | undefined) => {
      if (!publication) return;
      const { isSubscribed, track } = publication;
      console.log('try attach', { isSubscribed, track, element });
      if (element && track) {
        if (isSubscribed) {
          console.log('attach track to element', source);
          track.attach(element);
        } else {
          track.detach(element);
        }
      }
    };
    const listener = observeParticipantMedia(participant).subscribe((p) => {
      const publication = p.getTrack(source);
      console.log('participant media changed', publication);

      handleAttachment(publication);
      onParticipantMediaChange(publication);
    });
    const publication = participant.getTrack(source);
    handleAttachment(publication);
    onParticipantMediaChange(publication);

    return () => listener.unsubscribe();
  };

  return { className: getCSSClassName(`participant-media-${source}`), mediaListener };
}
