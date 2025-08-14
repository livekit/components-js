import { Mutex, type Room } from 'livekit-client';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { log } from '@livekit/components-core';

const CONNECT_DISCONNECT_WARNING_THRESHOLD_QUANTITY = 2;
const CONNECT_DISCONNECT_WARNING_THRESHOLD_MS = 400;

const ROOM_CHANGE_WARNING_THRESHOLD_QUANTITY = 3;
const ROOM_CHANGE_WARNING_THRESHOLD_MS = 1000;

/** @public */
export type UseSequentialRoomConnectDisconnectResults<R extends Room | undefined> = {
  connect: typeof Room.prototype.connect & (R extends undefined ? null : unknown);
  disconnect: typeof Room.prototype.disconnect & (R extends undefined ? null : unknown);
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
export function useSequentialRoomConnectDisconnect<R extends Room | undefined>(
  room: R,
): UseSequentialRoomConnectDisconnectResults<R> {
  const connectDisconnectQueueRef = useRef<
    Array<
      | {
          type: 'connect';
          room: Room;
          args: Parameters<typeof Room.prototype.connect>;
          resolve: (value: Awaited<ReturnType<typeof Room.prototype.connect>>) => void;
          reject: (err: Error) => void;
        }
      | {
          type: 'disconnect';
          room: Room;
          args: Parameters<typeof Room.prototype.disconnect>;
          resolve: (value: Awaited<ReturnType<typeof Room.prototype.disconnect>>) => void;
          reject: (err: Error) => void;
        }
    >
  >([]);

  // Process room connection / disconnection events and execute them in series
  // The main queue is a ref, so one invocation of this function can continue to process newly added
  // events
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
            await message.room
              .connect(...message.args)
              .then(message.resolve)
              .catch(message.reject);
            break;
          case 'disconnect':
            await message.room
              .disconnect(...message.args)
              .then(message.resolve)
              .catch(message.reject);
            break;
        }
      }
    });
  }, []);

  const roomChangedTimesRef = useRef<Array<Date>>([]);
  const checkRoomThreshold = useCallback((now: Date) => {
    let roomChangesInThreshold = 0;
    roomChangedTimesRef.current = roomChangedTimesRef.current.filter((i) => {
      const isWithinThreshold = now.getTime() - i.getTime() < ROOM_CHANGE_WARNING_THRESHOLD_MS;
      if (isWithinThreshold) {
        roomChangesInThreshold += 1;
      }
      return isWithinThreshold;
    });

    if (roomChangesInThreshold > ROOM_CHANGE_WARNING_THRESHOLD_QUANTITY) {
      log.warn(
        `useSequentialRoomConnectDisconnect: room changed reference rapidly (over ${ROOM_CHANGE_WARNING_THRESHOLD_QUANTITY}x in ${ROOM_CHANGE_WARNING_THRESHOLD_MS}ms). This is not recommended.`,
      );
    }
  }, []);

  // When the room changes, clear any pending connect / disconnect calls and log when it happened
  useEffect(() => {
    connectDisconnectQueueRef.current = [];

    const now = new Date();
    roomChangedTimesRef.current.push(now);
    checkRoomThreshold(now);
  }, [room, checkRoomThreshold]);

  const connectDisconnectEnqueueTimes = useRef<Array<Date>>([]);
  const checkConnectDisconnectThreshold = useCallback((now: Date) => {
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

  const connect = useCallback(
    async (...args: Parameters<typeof Room.prototype.connect>) => {
      return new Promise((resolve, reject) => {
        if (!room) {
          throw new Error('Called connect(), but room was unset');
        }
        const now = new Date();
        checkConnectDisconnectThreshold(now);
        connectDisconnectQueueRef.current.push({ type: 'connect', room, args, resolve, reject });
        connectDisconnectEnqueueTimes.current.push(now);
        processConnectsAndDisconnects();
      });
    },
    [room, checkConnectDisconnectThreshold, processConnectsAndDisconnects],
  );

  const disconnect = useCallback(
    async (...args: Parameters<typeof Room.prototype.disconnect>) => {
      return new Promise((resolve, reject) => {
        if (!room) {
          throw new Error('Called discconnect(), but room was unset');
        }
        const now = new Date();
        checkConnectDisconnectThreshold(now);
        connectDisconnectQueueRef.current.push({ type: 'disconnect', room, args, resolve, reject });
        connectDisconnectEnqueueTimes.current.push(now);
        processConnectsAndDisconnects();
      });
    },
    [room, checkConnectDisconnectThreshold, processConnectsAndDisconnects],
  );

  return {
    connect: room ? connect : null,
    disconnect: room ? disconnect : null,
  } as UseSequentialRoomConnectDisconnectResults<R>;
}
