import type { LocalParticipant, LocalTrackPublication, Participant } from 'livekit-client';
import {
  ParticipantEvent,
  type RemoteParticipant,
  type RemoteTrackPublication,
} from 'livekit-client';
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
  const updateMetadata = (_metadata: string | undefined) => {
    metadata.set(_metadata);
  };

  const name = new Signal.State<string | undefined>(participant.name);
  const updateName = (_name: string | undefined) => {
    name.set(_name);
  };

  const isSpeaking = new Signal.State<boolean>(participant.isSpeaking);
  const updateIsSpeaking = (_isSpeaking: boolean) => {
    isSpeaking.set(_isSpeaking);
  };

  participant.on(ParticipantEvent.ParticipantMetadataChanged, updateMetadata);
  participant.on(ParticipantEvent.ParticipantNameChanged, updateName);
  participant.on(ParticipantEvent.IsSpeakingChanged, updateIsSpeaking);

  abortSignal.addEventListener('abort', () => {
    participant.off(ParticipantEvent.ParticipantMetadataChanged, updateMetadata);
    participant.off(ParticipantEvent.ParticipantNameChanged, updateName);
    participant.off(ParticipantEvent.IsSpeakingChanged, updateIsSpeaking);
  });

  return {
    metadata: new Signal.Computed(() => metadata.get()),
    name: new Signal.Computed(() => name.get()),
    isSpeaking: new Signal.Computed(() => isSpeaking.get()),
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

  const addTrack = (track: RemoteTrackPublication) => {
    const existingTrack = tracks.get().find((t) => t.id === track.trackSid);
    if (!existingTrack) {
      tracks.set([...tracks.get(), createRemoteTrackSignalState(track, abortSignal)]);
    }
  };

  const removeTrack = (track: RemoteTrackPublication) => {
    tracks.set(tracks.get().filter((t) => t.id !== track.trackSid));
  };

  participant.on(ParticipantEvent.TrackPublished, addTrack);
  participant.on(ParticipantEvent.TrackUnpublished, removeTrack);

  abortSignal.addEventListener('abort', () => {
    participant.off(ParticipantEvent.TrackPublished, addTrack);
    participant.off(ParticipantEvent.TrackUnpublished, removeTrack);
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

// export function createLocalParticipantSignalState(
//   participant: LocalParticipant,
//   abortSignal: AbortSignal,
// ) {
//   const metadata = new Signal.State<string | undefined>(participant.metadata);
//   const updateMetadata = (_metadata: string | undefined) => {
//     metadata.set(_metadata);
//   };

//   const name = new Signal.State<string | undefined>(participant.name);
//   const updateName = (_name: string | undefined) => {
//     name.set(_name);
//   };

//   const isSpeaking = new Signal.State<boolean>(participant.isSpeaking);

//   return {
//     metadata: new Signal.Computed(() => metadata.get()),
//     name: new Signal.Computed(() => participant.name),
//     identity: new Signal.Computed(() => participant.identity),
//   };
// }
