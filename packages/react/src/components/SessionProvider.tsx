import * as React from 'react';
import { UseSessionReturn } from '../hooks';
import { RoomContext } from '../context';
import { SessionContext } from '../context/session-context';

/** @beta */
export type SessionProviderProps = {
  session: UseSessionReturn;
  children: React.ReactNode;
};

/**
 * The `SessionProvider` component instantiates a SessionContext from the return of useSession
 * @beta
 */
export function SessionProvider(props: SessionProviderProps) {
  return (
    <SessionContext.Provider value={props.session}>
      <RoomContext.Provider value={props.session.room}>{props.children}</RoomContext.Provider>
    </SessionContext.Provider>
  );
}
