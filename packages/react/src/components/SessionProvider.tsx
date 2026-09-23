import * as React from 'react';
import { SessionMode, UseSessionReturn } from '../hooks';
import { RoomContext } from '../context';
import { SessionContext } from '../context/session-context';

/** @beta */
export type SessionProviderProps = {
  session: UseSessionReturn<SessionMode>;
  children: React.ReactNode;
};

/**
 * The `SessionProvider` component instantiates a SessionContext from the return of useSession
 * @beta
 */
export function SessionProvider(props: SessionProviderProps) {
  // In text mode there is no Room; downstream room-dependent hooks are not supported yet.
  const room = props.session.mode === 'rtc' ? props.session.room : undefined;
  return (
    <SessionContext.Provider value={props.session}>
      <RoomContext.Provider value={room}>{props.children}</RoomContext.Provider>
    </SessionContext.Provider>
  );
}
