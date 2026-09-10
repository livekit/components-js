import { Participant } from 'livekit-client';
import * as React from 'react';
/** @public */
export declare const ParticipantContext: React.Context<Participant | undefined>;
/**
 * Ensures that a participant is provided via context.
 * If not inside a `ParticipantContext`, an error is thrown.
 * @public
 */
export declare function useParticipantContext(): Participant;
/**
 * Returns a participant from the `ParticipantContext` if it exists, otherwise `undefined`.
 * @public
 */
export declare function useMaybeParticipantContext(): Participant | undefined;
/**
 * Ensures that a participant is provided, either via context or explicitly as a parameter.
 * If not inside a `ParticipantContext` and no participant is provided, an error is thrown.
 * @public
 */
export declare function useEnsureParticipant(participant?: Participant): Participant;
//# sourceMappingURL=participant-context.d.ts.map