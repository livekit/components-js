import { connectionStateObserver } from '@livekit/components-core';
import type { Room } from 'livekit-client';
import * as React from 'react';
import { useEnsureRoom } from '../contexts';
import { useObservableState } from '../utils';

export interface ConnectionStatusProps extends React.HTMLAttributes<HTMLDivElement> {
  room?: Room;
}

export function useConnectionState(room?: Room) {
  // passed room takes precedence, if not supplied get current room context
  const r = useEnsureRoom(room);
  const connectionState = useObservableState(connectionStateObserver(r), r.state, [r]);
  return connectionState;
}

export const ConnectionState = ({ room, ...props }: ConnectionStatusProps) => {
  const connectionState = useConnectionState(room);
  return <div {...props}>{connectionState}</div>;
};
