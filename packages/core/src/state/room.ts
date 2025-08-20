import type { ConnectionState, Room, RemoteParticipant } from 'livekit-client';
import { RoomEvent } from 'livekit-client';
import { Signal } from 'signal-polyfill';
import {
  createRemoteParticipantSignalState,
  type RemoteParticipantSignalState,
} from './participant';

export type RoomSignalState = ReturnType<typeof createRoomSignalState>;

export { Signal };

export function createRoomSignalState(room: Room, abortSignal: AbortSignal) {
  const connectionState = new Signal.State(room.state);
  const updateConnectionState = (state: ConnectionState) => {
    connectionState.set(state);
  };

  const metadata = new Signal.State<string | undefined>(room.metadata);
  const updateMetadata = (_metadata: string | undefined) => {
    metadata.set(_metadata);
  };

  const remoteParticipants = new Signal.State<Array<RemoteParticipantSignalState>>(
    Array.from(room.remoteParticipants.values()).map((participant) =>
      createRemoteParticipantSignalState(participant, abortSignal),
    ),
  );
  const addRemoteParticipant = (participant: RemoteParticipant) => {
    const existingParticipant = remoteParticipants
      .get()
      .find((p) => p.identity === participant.identity);
    if (!existingParticipant) {
      remoteParticipants.set([
        ...remoteParticipants.get(),
        createRemoteParticipantSignalState(participant, abortSignal),
      ]);
    }
  };

  const removeRemoteParticipant = (participant: RemoteParticipant) => {
    remoteParticipants.set(
      remoteParticipants.get().filter((p) => p.identity !== participant.identity),
    );
  };

  room.on(RoomEvent.ConnectionStateChanged, updateConnectionState);
  room.on(RoomEvent.RoomMetadataChanged, updateMetadata);
  room.on(RoomEvent.ParticipantConnected, addRemoteParticipant);
  room.on(RoomEvent.ParticipantDisconnected, removeRemoteParticipant);

  abortSignal.addEventListener('abort', () => {
    room.off(RoomEvent.ConnectionStateChanged, updateConnectionState);
    room.off(RoomEvent.RoomMetadataChanged, updateMetadata);
    room.off(RoomEvent.ParticipantConnected, addRemoteParticipant);
    room.off(RoomEvent.ParticipantDisconnected, removeRemoteParticipant);
  });

  return {
    state: new Signal.Computed(() => connectionState.get()),
    metadata: new Signal.Computed(() => metadata.get()),
    remoteParticipants: new Signal.Computed(() => remoteParticipants.get()),
    subtle: {
      room,
    },
  };
}
