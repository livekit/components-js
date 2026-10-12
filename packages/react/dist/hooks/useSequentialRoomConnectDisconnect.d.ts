import { Room } from 'livekit-client';
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
export declare function useSequentialRoomConnectDisconnect<R extends Room | undefined>(room: R): UseSequentialRoomConnectDisconnectResults<R>;
//# sourceMappingURL=useSequentialRoomConnectDisconnect.d.ts.map