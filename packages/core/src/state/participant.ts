import type { LocalParticipant, LocalTrackPublication, Participant } from 'livekit-client';
import { ParticipantEvent, type RemoteParticipant } from 'livekit-client';
import { Signal } from 'signal-polyfill';
import {
  createLocalTrackSignalState,
  createRemoteTrackSignalState,
  type LocalTrackSignalState,
  type RemoteTrackSignalState,
} from './track';

export type RemoteParticipantSignalState = ReturnType<typeof createRemoteParticipantSignalState>;
export type LocalParticipantSignalState = ReturnType<typeof createLocalParticipantSignalState>;

export function createBaseParticipantSignalState(
  participant: Participant,
  abortSignal: AbortSignal,
) {
  const metadata = new Signal.State<string | undefined>(participant.metadata);
  const updateMetadata = () => {
    metadata.set(participant.metadata);
  };

  const name = new Signal.State<string | undefined>(participant.name);
  const updateName = () => {
    name.set(participant.name);
  };

  const isSpeaking = new Signal.State<boolean>(participant.isSpeaking);
  const updateIsSpeaking = () => {
    isSpeaking.set(participant.isSpeaking);
  };

  const isMicrophoneEnabled = new Signal.State<boolean>(participant.isMicrophoneEnabled);
  const isCameraEnabled = new Signal.State<boolean>(participant.isCameraEnabled);
  const isScreenShareEnabled = new Signal.State<boolean>(participant.isScreenShareEnabled);

  const updateMutedStatus = () => {
    isMicrophoneEnabled.set(participant.isMicrophoneEnabled);
    isCameraEnabled.set(participant.isCameraEnabled);
    isScreenShareEnabled.set(participant.isScreenShareEnabled);
  };

  participant.on(ParticipantEvent.ParticipantMetadataChanged, updateMetadata);
  participant.on(ParticipantEvent.ParticipantNameChanged, updateName);
  participant.on(ParticipantEvent.IsSpeakingChanged, updateIsSpeaking);
  participant.on(ParticipantEvent.TrackMuted, updateMutedStatus);
  participant.on(ParticipantEvent.TrackUnmuted, updateMutedStatus);
  participant.on(ParticipantEvent.TrackPublished, updateMutedStatus);
  participant.on(ParticipantEvent.TrackUnpublished, updateMutedStatus);
  participant.on(ParticipantEvent.LocalTrackPublished, updateMutedStatus);
  participant.on(ParticipantEvent.LocalTrackUnpublished, updateMutedStatus);

  abortSignal.addEventListener('abort', () => {
    participant.off(ParticipantEvent.ParticipantMetadataChanged, updateMetadata);
    participant.off(ParticipantEvent.ParticipantNameChanged, updateName);
    participant.off(ParticipantEvent.IsSpeakingChanged, updateIsSpeaking);
    participant.off(ParticipantEvent.TrackMuted, updateMutedStatus);
    participant.off(ParticipantEvent.TrackUnmuted, updateMutedStatus);
    participant.off(ParticipantEvent.TrackPublished, updateMutedStatus);
    participant.off(ParticipantEvent.TrackUnpublished, updateMutedStatus);
    participant.off(ParticipantEvent.LocalTrackPublished, updateMutedStatus);
    participant.off(ParticipantEvent.LocalTrackUnpublished, updateMutedStatus);
  });

  return {
    metadata: new Signal.Computed(() => metadata.get()),
    name: new Signal.Computed(() => name.get()),
    isSpeaking: new Signal.Computed(() => isSpeaking.get()),
    isMicrophoneEnabled: new Signal.Computed(() => isMicrophoneEnabled.get()),
    isCameraEnabled: new Signal.Computed(() => isCameraEnabled.get()),
    isScreenShareEnabled: new Signal.Computed(() => isScreenShareEnabled.get()),
    identity: participant.identity,
  };
}

export function createRemoteParticipantSignalState(
  participant: RemoteParticipant,
  abortSignal: AbortSignal,
) {
  const tracks = new Signal.State<Array<RemoteTrackSignalState>>(
    Array.from(participant.trackPublications.values()).map((track) =>
      createRemoteTrackSignalState(track, abortSignal),
    ),
  );

  const updateTracks = () => {
    const existingTracks = tracks.get();
    const newTracks = Array.from(participant.trackPublications.values()).filter(
      (track) => !existingTracks.some((t) => t.id === track.trackSid),
    );
    if (newTracks.length > 0) {
      tracks.set([
        ...existingTracks,
        ...newTracks.map((track) => createRemoteTrackSignalState(track, abortSignal)),
      ]);
    }
  };

  participant.on(ParticipantEvent.TrackPublished, updateTracks);
  participant.on(ParticipantEvent.TrackUnpublished, updateTracks);

  abortSignal.addEventListener('abort', () => {
    participant.off(ParticipantEvent.TrackPublished, updateTracks);
    participant.off(ParticipantEvent.TrackUnpublished, updateTracks);
  });

  const baseParticipantState = createBaseParticipantSignalState(participant, abortSignal);

  return {
    ...baseParticipantState,
    tracks: new Signal.Computed(() => tracks.get()),
  };
}

export function createLocalParticipantSignalState(
  participant: LocalParticipant,
  abortSignal: AbortSignal,
) {
  const baseParticipantState = createBaseParticipantSignalState(participant, abortSignal);

  const tracks = new Signal.State<Array<LocalTrackSignalState>>(
    Array.from(participant.trackPublications.values()).map((track) =>
      createLocalTrackSignalState(track, abortSignal),
    ),
  );

  const addTrack = (track: LocalTrackPublication) => {
    const existingTrack = tracks.get().find((t) => t.id === track.trackSid);
    if (!existingTrack) {
      tracks.set([...tracks.get(), createLocalTrackSignalState(track, abortSignal)]);
    }
  };

  const removeTrack = (track: LocalTrackPublication) => {
    tracks.set(tracks.get().filter((t) => t.id !== track.trackSid));
  };

  participant.on(ParticipantEvent.LocalTrackPublished, addTrack);
  participant.on(ParticipantEvent.LocalTrackUnpublished, removeTrack);

  abortSignal.addEventListener('abort', () => {
    participant.off(ParticipantEvent.LocalTrackPublished, addTrack);
    participant.off(ParticipantEvent.LocalTrackUnpublished, removeTrack);
  });

  return {
    ...baseParticipantState,
    tracks: new Signal.Computed(() => tracks.get()),
  };
}
