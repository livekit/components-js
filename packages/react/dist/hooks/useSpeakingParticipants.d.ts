import { Room } from 'livekit-client';
/** @public */
export type UseSpeakingParticipantsOptions = {
    room?: Room;
};
/**
 * The `useSpeakingParticipants` hook returns only the active speakers of all participants.
 *
 * @example
 * ```tsx
 * const activeSpeakers = useSpeakingParticipants();
 * ```
 * @public
 */
export declare function useSpeakingParticipants(options?: UseSpeakingParticipantsOptions): import('livekit-client').Participant[];
//# sourceMappingURL=useSpeakingParticipants.d.ts.map