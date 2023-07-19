import type { Room } from 'livekit-client';
import * as React from 'react';
import { useConnectionState } from '../hooks';

/** @public */
export interface ConnectionStatusProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The room from which the connection status should be displayed.
   */
  room?: Room;
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
