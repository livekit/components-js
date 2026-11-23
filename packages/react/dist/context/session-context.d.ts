import { UseSessionReturn } from '../hooks/useSession';
import * as React from 'react';
/** @internal */
export declare const SessionContext: React.Context<UseSessionReturn | undefined>;
/**
 * Ensures that a session is provided via context.
 * If no session is provided, an error is thrown.
 * @beta
 */
export declare function useSessionContext(): UseSessionReturn;
/**
 * Returns the session context if it exists, otherwise undefined.
 * @beta
 */
export declare function useMaybeSessionContext(): UseSessionReturn | undefined;
/**
 * Ensures that a session is provided, either via context or explicitly as a parameter.
 * If no session is provided, an error is thrown.
 * @beta
 */
export declare function useEnsureSession(session?: UseSessionReturn): UseSessionReturn;
//# sourceMappingURL=session-context.d.ts.map