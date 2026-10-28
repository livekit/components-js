import * as React from 'react';

import { UseThreadReturn } from '../hooks/useThread';

/** @internal */
export const ThreadContext = React.createContext<UseThreadReturn | undefined>(undefined);

/**
 * Ensures that a thread is provided via context.
 * If no thread is provided, an error is thrown.
 * @beta
 */
export function useThreadContext() {
  const ctx = React.useContext(ThreadContext);
  if (!ctx) {
    throw Error('tried to access thread context outside of ThreadProvider component');
  }
  return ctx;
}

/**
 * Returns the thread context if it exists, otherwise undefined.
 * @beta
 */
export function useMaybeThreadContext() {
  return React.useContext(ThreadContext);
}

/**
 * Ensures that a thread is provided, either via context or explicitly as a parameter.
 * If no thread is provided, an error is thrown.
 * @beta
 */
export function useEnsureThread(thread?: UseThreadReturn) {
  const context = useMaybeThreadContext();
  const r = thread ?? context;
  if (!r) {
    throw new Error(
      'No thread provided, make sure you are inside a Thread context or pass the thread explicitly',
    );
  }
  return r;
}
