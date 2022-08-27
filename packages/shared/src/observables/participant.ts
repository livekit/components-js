import { type Participant, ParticipantEvent } from 'livekit-client';
import { Observable } from 'rxjs';

export function observeParticipant(participant: Participant) {
  const participantObserver = observeParticipantEvents(
    participant,
    ParticipantEvent.TrackMuted,
    ParticipantEvent.TrackUnmuted,
    ParticipantEvent.ParticipantMetadataChanged,
    ParticipantEvent.ParticipantPermissionsChanged,
    ParticipantEvent.IsSpeakingChanged,
    ParticipantEvent.TrackPublished,
    ParticipantEvent.TrackUnpublished,
    ParticipantEvent.TrackSubscribed,
    ParticipantEvent.TrackUnsubscribed,
    ParticipantEvent.LocalTrackPublished,
    ParticipantEvent.LocalTrackUnpublished,
    ParticipantEvent.ConnectionQualityChanged,
  );

  return participantObserver;
}

export const observeParticipantEvents = (
  participant: Participant,
  ...events: ParticipantEvent[]
) => {
  const observable = new Observable<Participant>((subscribe) => {
    const onParticipantUpdate = () => {
      subscribe.next(participant);
    };

    events.forEach((evt) => {
      participant.on(evt, onParticipantUpdate);
    });

    const unsubscribe = () => {
      events.forEach((evt) => {
        participant.off(evt, onParticipantUpdate);
      });
    };
    return unsubscribe;
  });

  return observable;
};
