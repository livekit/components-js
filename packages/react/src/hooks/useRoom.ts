import { createRoomSignalState } from '@livekit/components-core';
import type { RoomConnectOptions, RoomOptions } from 'livekit-client';
import { Room } from 'livekit-client';
import { useEffect, useMemo, useState } from 'react';

import type { LiveKitRoomContext } from '../context/room-context';
import type { ParticipantPermission } from '@livekit/protocol';

export type ConnectionDetails = {
  url: string;
  token: string;
};

export function useRoom(
  options?: RoomOptions,
  connectOptions?: RoomConnectOptions,
): LiveKitRoomContext {
  const [abortController] = useState(() => new AbortController());
  const [connectionDetails, setConnectionDetails] = useState<ConnectionDetails | undefined>(
    undefined,
  );
  const room = useMemo(() => new Room(options), [options]);
  const roomState = useMemo(
    () => createRoomSignalState(room, abortController.signal),
    [room, abortController],
  );
  useEffect(() => {
    return () => {
      abortController.abort();
    };
  }, [abortController, room]);

  const subtle = useMemo(() => ({ room }), [room]);

  const actions = useMemo(
    () => ({
      setConnectionDetails: (details: ConnectionDetails) => setConnectionDetails(details),
      connect: () => {
        if (!connectionDetails) {
          throw new Error('Connection details are not set');
        }
        return room.connect(connectionDetails.url, connectionDetails.token, connectOptions);
      },
      disconnect: () => room.disconnect(),
      updateLocalParticipantMetadata: (metadata: string) =>
        room.localParticipant.setMetadata(metadata),
      updateLocalParticipantPermission: async (permission: ParticipantPermission) =>
        room.localParticipant.setPermissions(permission),
      setMicrophoneEnabled: async (enabled: boolean) => {
        const publication = await room.localParticipant.setMicrophoneEnabled(enabled);
        return publication
          ? roomState.localParticipant.tracks.get().find((t) => t.id === publication.trackSid)
          : undefined;
      },
      setCameraEnabled: async (enabled: boolean) => {
        const publication = await room.localParticipant.setCameraEnabled(enabled);
        return publication
          ? roomState.localParticipant.tracks.get().find((t) => t.id === publication.trackSid)
          : undefined;
      },
      setScreenShareEnabled: async (enabled: boolean) => {
        const publication = await room.localParticipant.setScreenShareEnabled(enabled);
        return publication
          ? roomState.localParticipant.tracks.get().find((t) => t.id === publication.trackSid)
          : undefined;
      },
    }),
    [room, connectionDetails, connectOptions, roomState.localParticipant.tracks],
  );
  return { roomState, actions, subtle };
}
