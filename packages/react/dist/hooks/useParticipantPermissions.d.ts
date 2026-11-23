import { ParticipantPermission } from '@livekit/protocol';
import { Participant } from 'livekit-client';
/**
 * The `useParticipantPermissions` hook returns the permissions of a given participant.
 *
 * @example
 * ```tsx
 * const permissions = useParticipantPermissions({ participant });
 * ```
 * @public
 */
export interface UseParticipantPermissionsOptions {
    participant?: Participant;
}
/** @public */
export declare function useParticipantPermissions(options?: UseParticipantPermissionsOptions): ParticipantPermission | undefined;
//# sourceMappingURL=useParticipantPermissions.d.ts.map