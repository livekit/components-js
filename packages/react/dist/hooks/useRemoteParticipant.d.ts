import { ParticipantIdentifier } from '@livekit/components-core';
import { ParticipantEvent, RemoteParticipant } from 'livekit-client';
/** @public */
export interface UseRemoteParticipantOptions {
    /**
     * To optimize performance, you can use the `updateOnlyOn` property to decide on what `ParticipantEvents` the hook updates.
     * By default it updates on all relevant ParticipantEvents to keep the returned participant up to date.
     */
    updateOnlyOn?: ParticipantEvent[];
}
/**
 * The `useRemoteParticipant` hook returns the first RemoteParticipant by either identity and/or based on the participant kind.
 * @remarks
 * To optimize performance, you can use the `updateOnlyOn` property to decide on what `ParticipantEvents` the hook updates.
 *
 * @example
 * ```tsx
 * const participant = useRemoteParticipant({kind: ParticipantKind.Agent, identity: 'myAgent'});
 * ```
 * @public
 */
export declare function useRemoteParticipant(identifier: ParticipantIdentifier, options?: UseRemoteParticipantOptions): RemoteParticipant | undefined;
/**
 * The `useRemoteParticipant` hook returns the first RemoteParticipant by either identity or based on the participant kind.
 * @remarks
 * To optimize performance, you can use the `updateOnlyOn` property to decide on what `ParticipantEvents` the hook updates.
 *
 * @example
 * ```tsx
 * const participant = useRemoteParticipant('Russ');
 * ```
 * @public
 */
export declare function useRemoteParticipant(identity: string, options?: UseRemoteParticipantOptions): RemoteParticipant | undefined;
//# sourceMappingURL=useRemoteParticipant.d.ts.map