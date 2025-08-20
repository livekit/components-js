import type { ConnectionState, Room } from 'livekit-client';
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
    updateRemoteParticipants();
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

  const updateRemoteParticipants = () => {
    const existingParticipants = remoteParticipants.get();
    const newParticipants = Array.from(room.remoteParticipants.values()).filter(
      (participant) => !existingParticipants.some((p) => p.identity === participant.identity),
    );

    if (newParticipants.length > 0) {
      remoteParticipants.set([
        ...existingParticipants,
        ...newParticipants.map((participant) =>
          createRemoteParticipantSignalState(participant, abortSignal),
        ),
      ]);
    }
  };

  room.on(RoomEvent.ConnectionStateChanged, updateConnectionState);
  room.on(RoomEvent.RoomMetadataChanged, updateMetadata);
  room.on(RoomEvent.ParticipantConnected, updateRemoteParticipants);
  room.on(RoomEvent.ParticipantDisconnected, updateRemoteParticipants);

  abortSignal.addEventListener('abort', () => {
    room.off(RoomEvent.ConnectionStateChanged, updateConnectionState);
    room.off(RoomEvent.RoomMetadataChanged, updateMetadata);
    room.off(RoomEvent.ParticipantConnected, updateRemoteParticipants);
    room.off(RoomEvent.ParticipantDisconnected, updateRemoteParticipants);
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
