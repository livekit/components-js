import { Room } from 'livekit-client';
/**
 * The `useRoomInfo` hook returns the name and metadata of the given `Room`.
 * @remarks
 * Needs to be called inside a `RoomContext` or by passing a `Room` instance.
 *
 * @example
 * ```tsx
 * const { name, metadata } = useRoomInfo();
 * ```
 * @public
 */
export interface UseRoomInfoOptions {
    room?: Room;
}
/** @public */
export declare function useRoomInfo(options?: UseRoomInfoOptions): {
    name: string;
    metadata: string | undefined;
};
//# sourceMappingURL=useRoomInfo.d.ts.map