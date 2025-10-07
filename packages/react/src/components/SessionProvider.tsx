import * as React from 'react';
import { UseSessionReturn } from '../hooks';
import { RoomContext } from '../context';
// NOTE: the below `useSession` is mentioned in a tsdoc comment
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useSession } from '../hooks';
import { SessionContext } from '../context/session-context';

/** @public */
export type SessionProviderProps = {
  session: UseSessionReturn;
  children: React.ReactNode;
};

/**
 * The `SessionProvider` component instantiates a SessionContext from the return of {@link useSession}
 * @public
 */
export function SessionProvider(props: SessionProviderProps) {
  return (
    <SessionContext.Provider value={props.session}>
      <RoomContext.Provider value={props.session.room}>{props.children}</RoomContext.Provider>
    </SessionContext.Provider>
  );
}
