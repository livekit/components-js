import * as React from 'react';

import { UseSessionReturn } from '../hooks/useSession';

/** @internal */
export const SessionContext = React.createContext<UseSessionReturn | undefined>(undefined);

/**
 * Ensures that a session is provided via context.
 * If no session is provided, an error is thrown.
 * @beta
 */
export function useSessionContext() {
  const ctx = React.useContext(SessionContext);
  if (!ctx) {
    throw Error('tried to access session context outside of SessionProvider component');
  }
  return ctx;
}

/**
 * Returns the session context if it exists, otherwise undefined.
 * @beta
 */
export function useMaybeSessionContext() {
  return React.useContext(SessionContext);
}

/**
 * Ensures that a session is provided, either via context or explicitly as a parameter.
 * If no session is provided, an error is thrown.
 * @beta
 */
export function useEnsureSession(session?: UseSessionReturn) {
  const context = useMaybeSessionContext();
  const r = session ?? context;
  if (!r) {
    throw new Error(
      'No session provided, make sure you are inside a Session context or pass the session explicitly',
    );
  }
  return r;
}
