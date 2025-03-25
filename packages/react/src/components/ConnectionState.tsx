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
 * The `ConnectionState` component displays the connection status of the room as strings
 * (`"connected" | "connecting" | "disconnected" | "reconnecting"`).
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <ConnectionState />
 * </LiveKitRoom>
 * ```
 * @public
 */
export const ConnectionState: (
  props: ConnectionStatusProps & React.RefAttributes<HTMLDivElement>,
) => React.ReactNode = /* @__PURE__ */ React.forwardRef<HTMLDivElement, ConnectionStatusProps>(
  function ConnectionState({ room, ...props }: ConnectionStatusProps, ref) {
    const connectionState = useConnectionState(room);
    return (
      <div ref={ref} {...props}>
        {connectionState}
      </div>
    );
  },
);
