import { RoomEvent, RemoteParticipant, Room } from 'livekit-client';
/** @public */
export interface UseRemoteParticipantsOptions {
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
 * The `useRemoteParticipants` hook returns all remote participants (without the local) of the current room.
 * @remarks
 * To optimize performance, you can use the `updateOnlyOn` property to decide on what `RoomEvents` the hook updates.
 *
 * @example
 * ```tsx
 * const participants = useRemoteParticipants();
 * <ParticipantLoop participants={participants}>
 *  <ParticipantName />
 * </ParticipantLoop>
 * ```
 * @public
 */
export declare function useRemoteParticipants(options?: UseRemoteParticipantsOptions): RemoteParticipant[];
//# sourceMappingURL=useRemoteParticipants.d.ts.map