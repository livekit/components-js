import { Observable } from 'rxjs';
import {
  ConnectionQuality,
  type Participant,
  ParticipantEvent,
  type TrackPublication,
} from 'livekit-client';

export interface ParticipantState {
  isSpeaking: boolean;
  connectionQuality: ConnectionQuality;
  isLocal: boolean;
  metadata?: string;
  publications: TrackPublication[];
  subscribedTracks: TrackPublication[];
  cameraPublication?: TrackPublication;
  microphonePublication?: TrackPublication;
  screenSharePublication?: TrackPublication;
}

export function observeParticipant(participant: Participant) {
  const observable = new Observable<Participant>((subscribe) => {
    const onParticipantUpdate = () => {
      subscribe.next(participant);
    };

    participant
      .on(ParticipantEvent.TrackMuted, onParticipantUpdate)
      .on(ParticipantEvent.TrackUnmuted, onParticipantUpdate)
      .on(ParticipantEvent.ParticipantMetadataChanged, onParticipantUpdate)
      .on(ParticipantEvent.IsSpeakingChanged, onParticipantUpdate)
      .on(ParticipantEvent.TrackPublished, onParticipantUpdate)
      .on(ParticipantEvent.TrackUnpublished, onParticipantUpdate)
      .on(ParticipantEvent.TrackSubscribed, onParticipantUpdate)
      .on(ParticipantEvent.TrackUnsubscribed, onParticipantUpdate)
      .on(ParticipantEvent.LocalTrackPublished, onParticipantUpdate)
      .on(ParticipantEvent.LocalTrackUnpublished, onParticipantUpdate)
      .on(ParticipantEvent.ConnectionQualityChanged, onParticipantUpdate);

    const unsubscribe = () => {
      // cleanup
      participant
        .off(ParticipantEvent.TrackMuted, onParticipantUpdate)
        .off(ParticipantEvent.TrackUnmuted, onParticipantUpdate)
        .off(ParticipantEvent.ParticipantMetadataChanged, onParticipantUpdate)
        .off(ParticipantEvent.IsSpeakingChanged, onParticipantUpdate)
        .off(ParticipantEvent.TrackPublished, onParticipantUpdate)
        .off(ParticipantEvent.TrackUnpublished, onParticipantUpdate)
        .off(ParticipantEvent.TrackSubscribed, onParticipantUpdate)
        .off(ParticipantEvent.TrackUnsubscribed, onParticipantUpdate)
        .off(ParticipantEvent.LocalTrackPublished, onParticipantUpdate)
        .off(ParticipantEvent.LocalTrackUnpublished, onParticipantUpdate)
        .off(ParticipantEvent.ConnectionQualityChanged, onParticipantUpdate);
    };
    return unsubscribe;
  });
  return { subscribe: observable.subscribe };
}
