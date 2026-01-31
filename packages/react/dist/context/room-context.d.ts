import { Room } from 'livekit-client';
import * as React from 'react';
/** @public */
export declare const RoomContext: React.Context<Room | undefined>;
/**
 * Ensures that a room is provided via context.
 * If no room is provided, an error is thrown.
 * @public
 */
export declare function useRoomContext(): Room;
/**
 * Returns the room context if it exists, otherwise undefined.
 * @public
 */
export declare function useMaybeRoomContext(): Room | undefined;
/**
 * Ensures that a room is provided, either via context or explicitly as a parameter.
 * If no room is provided, an error is thrown.
 * @public
 */
export declare function useEnsureRoom(room?: Room): Room;
//# sourceMappingURL=room-context.d.ts.map