import { connectionStateObserver } from '@livekit/components-core';
import type { Room } from 'livekit-client';
import * as React from 'react';
import { useEnsureRoom } from '../context';
import { useObservableState } from '../hooks/internal/useObservableState';

/** @public */
export interface ConnectionStatusProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The room from which the connection status should be displayed.
   */
  room?: Room;
}

/**
 * The `useConnectionState` hook allows you to simply implement your own `ConnectionState` component.
 *
 * @example
 * ```tsx
 * const connectionState = useConnectionState(room);
 * ```
 * @public
 */
export function useConnectionState(room?: Room) {
  // passed room takes precedence, if not supplied get current room context
  const r = useEnsureRoom(room);
  const observable = React.useMemo(() => connectionStateObserver(r), [r]);
  const connectionState = useObservableState(observable, r.state);
  return connectionState;
}

/**
 * The ConnectionState component displays the connection status of the room in written form.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <ConnectionState />
 * </LiveKitRoom>
 * ```
 * @public
 */
export function ConnectionState({ room, ...props }: ConnectionStatusProps) {
  const connectionState = useConnectionState(room);
  return <div {...props}>{connectionState}</div>;
}
