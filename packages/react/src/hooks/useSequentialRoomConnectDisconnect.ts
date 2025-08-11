import { Mutex, Room } from 'livekit-client';
import { useCallback, useMemo, useRef } from 'react';
import { log } from '@livekit/components-core';

const CONNECT_DISCONNECT_WARNING_THRESHOLD_MS = 400;
const CONNECT_DISCONNECT_WARNING_THRESHOLD_QUANTITY = 2;

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
  const connectDisconnectQueueRef = useRef<
    Array<
      | {
          type: 'connect';
          args: Parameters<typeof Room.prototype.connect>;
          resolve: () => void;
          reject: (err: Error) => void;
        }
      | {
          type: 'disconnect';
          args: Parameters<typeof Room.prototype.disconnect>;
          resolve: () => void;
          reject: (err: Error) => void;
        }
    >
  >([]);

  const processConnectsAndDisconnectsLock = useMemo(() => new Mutex(), []);
  const processConnectsAndDisconnects = useCallback(async () => {
    return processConnectsAndDisconnectsLock.lock().then(async (unlock) => {
      while (true) {
        const message = connectDisconnectQueueRef.current.pop();
        if (!message) {
          unlock();
          break;
        }

        switch (message.type) {
          case 'connect':
            await room
              .connect(...message.args)
              .then(message.resolve)
              .catch(message.reject);
            break;
          case 'disconnect':
            await room
              .disconnect(...message.args)
              .then(message.resolve)
              .catch(message.reject);
            break;
        }
      }
    });
  }, []);

  const connectDisconnectEnqueueTimes = useRef<Array<Date>>([]);
  const checkThreshold = useCallback((now: Date) => {
    let connectDisconnectsInThreshold = 0;
    connectDisconnectEnqueueTimes.current = connectDisconnectEnqueueTimes.current.filter((i) => {
      const isWithinThreshold =
        now.getTime() - i.getTime() < CONNECT_DISCONNECT_WARNING_THRESHOLD_MS;
      if (isWithinThreshold) {
        connectDisconnectsInThreshold += 1;
      }
      return isWithinThreshold;
    });

    if (connectDisconnectsInThreshold > CONNECT_DISCONNECT_WARNING_THRESHOLD_QUANTITY) {
      log.warn(
        `useSequentialRoomConnectDisconnect: room connect / disconnect occurring in rapid sequence (over ${CONNECT_DISCONNECT_WARNING_THRESHOLD_QUANTITY}x in ${CONNECT_DISCONNECT_WARNING_THRESHOLD_MS}ms). This is not recommended and may be the sign of a bug like a useEffect dependency changing every render.`,
      );
    }
  }, []);

  return {
    connect: useCallback(
      async (...args) => {
        return new Promise((resolve, reject) => {
          const now = new Date();
          checkThreshold(now);
          connectDisconnectQueueRef.current.push({ type: 'connect', args, resolve, reject });
          connectDisconnectEnqueueTimes.current.push(now);
          processConnectsAndDisconnects();
        });
      },
      [checkThreshold, processConnectsAndDisconnects],
    ),
    disconnect: useCallback(
      async (...args) => {
        return new Promise((resolve, reject) => {
          const now = new Date();
          checkThreshold(now);
          connectDisconnectQueueRef.current.push({ type: 'disconnect', args, resolve, reject });
          connectDisconnectEnqueueTimes.current.push(now);
          processConnectsAndDisconnects();
        });
      },
      [checkThreshold, processConnectsAndDisconnects],
    ),
  };
}
