import * as React from 'react';
import { UseSessionReturn } from '../hooks';
import { RoomContext } from '../context';
import { SessionContext } from '../context/session-context';
import { ThreadContext } from '../context/thread-context';

/** @beta */
export type SessionProviderProps = {
  session: UseSessionReturn;
  children: React.ReactNode;
};

/**
 * The `SessionProvider` component instantiates a SessionContext from the return of useSession. It also
 * provides the composed thread as a ThreadContext (via the session's `internal.thread` back-reference),
 * so `useThreadMessages` and `useAgent` resolve without being passed the thread explicitly.
 * @beta
 */
export function SessionProvider(props: SessionProviderProps) {
  return (
    <SessionContext.Provider value={props.session}>
      <ThreadContext.Provider value={props.session.internal.thread}>
        <RoomContext.Provider value={props.session.room}>{props.children}</RoomContext.Provider>
      </ThreadContext.Provider>
    </SessionContext.Provider>
  );
}
