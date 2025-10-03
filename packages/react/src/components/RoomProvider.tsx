import { Room } from 'livekit-client';
import * as React from 'react';
import { UseSessionReturn } from '../hooks';
import { RoomContext } from '../context';

/** @public */
export type RoomProviderPropsRoom = {
  room: Room;
  children: React.ReactNode;
};

/** @public */
export type RoomProviderPropsSession = {
  session: UseSessionReturn;
  children: React.ReactNode;
};

/** @public */
export type RoomProviderProps = RoomProviderPropsRoom | RoomProviderPropsSession;

/**
 * The `RoomProvider` component instantiates a RoomContext from either a {@link Room} or a Session.
 * @public
 */
export function RoomProvider(props: RoomProviderProps) {
  let room;
  if ('session' in props) {
    room = props.session.room;
  } else {
    room = props.room;
  }

  return <RoomContext.Provider value={room}>{props.children}</RoomContext.Provider>;
}
