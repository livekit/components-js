import { Mutex, type TrackPublishOptions, Room } from 'livekit-client';
import { useEffect, useMemo, useState } from 'react';
import { useMaybeRoomContext } from '../context';

type UseRoomConnectionDetails = {
  serverUrl: string;
  participantToken: string;
};

type UseRoomConnectionOptions = {
  getConnectionDetails: () => Promise<UseRoomConnectionDetails>;
  onConnectionError?: (err: Error) => void;

  room?: Room;
  /** Should the room attempt to connect? If false, the room will disconnect. */
  connected?: boolean;
  trackPublishOptions?: TrackPublishOptions;
};

type UseRoomConnectionResult = {
  room: Room;

  /** What operation is the useRoomConnection hook currently in the midst of performing?  */
  status: 'idle' | 'connecting' | 'disconnecting';
};

/**
 * The `useRoomConnection` hook provides a fully managed way to connect / disconnect from a LiveKit
 * room. To control whether the connection is active or not, use `options.connected`.
 * @remarks
 * Can be called inside a `RoomContext` or by passing a `Room` instance, otherwise creates a Room
 * itself.
 *
 * @example
 * ```tsx
 * const { room } = useRoomConnection({
 *   getConnectionDetails: async () => {
 *     // compute the below value out of band:
 *     return { serverUrl: "...", participantToken: "..." };
 *   },
 * });
 * ```
 * @public
 */
export function useRoomConnection(options: UseRoomConnectionOptions): UseRoomConnectionResult {
  const roomFromContext = useMaybeRoomContext();
  const room = useMemo(() => {
    return roomFromContext ?? options.room ?? (new Room());
  }, [options.room, roomFromContext]);

  const connected = options.connected ?? true;

  const [status, setStatus] = useState<'idle' | 'connecting' | 'disconnecting'>('idle');

  // NOTE: it would on the surface seem that managing a room's connection with a useEffect would be
  // straightforward, but `room.disconnect()` is async and useEffect doesn't support async cleanup
  // functions, which means `room.connect()` can run in the midst of `room.disconnect()`, causing
  // race conditions.
  const connectDisconnectLock = useMemo(() => new Mutex(), []);
  useEffect(() => {
    connectDisconnectLock.lock().then(async (unlock) => {
      if (connected) {
        setStatus('connecting');
        const connectionDetails = await options.getConnectionDetails();
        try {
          await Promise.all([
            room.localParticipant.setMicrophoneEnabled(true, undefined, options.trackPublishOptions),
            room.connect(connectionDetails.serverUrl, connectionDetails.participantToken),
          ]);
        } catch (error) {
          options.onConnectionError?.(error as Error);
        } finally {
          setStatus('idle');
        }
      } else {
        setStatus('disconnecting');
        try {
          await room.disconnect();
        } catch (error) {
          options.onConnectionError?.(error as Error);
        } finally {
          setStatus('idle');
        }
      };
      unlock();
    });
  }, [connected]);

  return { room, status };
}
