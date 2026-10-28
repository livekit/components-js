import * as React from 'react';
import { UseThreadReturn } from '../hooks';
import { ThreadContext } from '../context/thread-context';

/** @beta */
export type ThreadProviderProps = {
  thread: UseThreadReturn;
  children: React.ReactNode;
};

/**
 * The `ThreadProvider` component instantiates a ThreadContext from the return of useThread, so that
 * `useThreadMessages` and `useAgent` can resolve the thread without it being passed explicitly.
 * @beta
 */
export function ThreadProvider(props: ThreadProviderProps) {
  return <ThreadContext.Provider value={props.thread}>{props.children}</ThreadContext.Provider>;
}
