import { Mutex, Room } from 'livekit-client';
import { useCallback, useMemo } from 'react';

/** @public */
export type UseSequentialRoomConnectDisconnectResults = {
  connect: typeof Room.prototype.connect;
  disconnect: typeof Room.prototype.disconnect;
};

/**
 * When calling room.disconnect() as part of a React useEffect cleanup function, it is possible for
 * a room.connect(...) in the effect body to start running while the room.disconnect() is still
 * running. This hook sequentializes these two operations, so they always happen in order and
 * never overlap.
 *
 * @example
 * ```ts
 * const { connect, disconnect } = useSequentialRoomConnectDisconnect(room);
 *
 * // Connecting to a room:
 * useEffect(() => {
 *   connect();
 *   return () => disconnect();
 * }, [connect, disconnect]);
 * ```
 *
 * @public
 */
export function useSequentialRoomConnectDisconnect(
  room: Room,
): UseSequentialRoomConnectDisconnectResults {
  const connectDisconnectLock = useMemo(() => new Mutex(), []);
  return {
    connect: useCallback(
      async (...args) => {
        return connectDisconnectLock.lock().then(async (unlock) => {
          const result = await room.connect(...args);
          unlock();
          return result;
        });
      },
      [room],
    ),
    disconnect: useCallback(
      async (...args) => {
        return connectDisconnectLock.lock().then(async (unlock) => {
          const result = await room.disconnect(...args);
          unlock();
          return result;
        });
      },
      [room],
    ),
  };
}
