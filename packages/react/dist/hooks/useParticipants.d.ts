import { Room, RoomEvent } from 'livekit-client';
/** @public */
export interface UseParticipantsOptions {
    /**
     * To optimize performance, you can use the `updateOnlyOn` property to decide on what RoomEvents the hook updates.
     * By default it updates on all relevant RoomEvents to keep the returned participants array up to date.
     * The minimal set of non-overwriteable `RoomEvents` is: `[RoomEvent.ParticipantConnected, RoomEvent.ParticipantDisconnected, RoomEvent.ConnectionStateChanged]`
     */
    updateOnlyOn?: RoomEvent[];
    /**
     * The room to use. If not provided, the hook will use the room from the context.
     */
    room?: Room;
}
/**
 * The `useParticipants` hook returns all participants (local and remote) of the current room.
 * @remarks
 * To optimize performance, you can use the `updateOnlyOn` property to decide on what `RoomEvents` the hook updates.
 *
 * @example
 * ```tsx
 * const participants = useParticipants();
 * <ParticipantLoop participants={participants}>
 *  <ParticipantName />
 * </ParticipantLoop>
 * ```
 * @public
 */
export declare function useParticipants(options?: UseParticipantsOptions): (import('livekit-client').RemoteParticipant | import('livekit-client').LocalParticipant)[];
//# sourceMappingURL=useParticipants.d.ts.map