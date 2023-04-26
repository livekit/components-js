import { ConnectionState } from 'livekit-client';
import { setupDisconnectButton } from '@livekit/components-core';
import * as React from 'react';
import { useRoomContext } from '../../context';
import { useConnectionState } from '../ConnectionState';
import { mergeProps } from '../../utils';

/** @public */
export type DisconnectButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  stopTracks?: boolean;
};

/** @public */
export function useDisconnectButton(props: DisconnectButtonProps) {
  const room = useRoomContext();
  const connectionState = useConnectionState(room);

  const buttonProps = React.useMemo(() => {
    const { className, disconnect } = setupDisconnectButton(room);
    const mergedProps = mergeProps(props, {
      className,
      onClick: () => disconnect(props.stopTracks ?? true),
      disabled: connectionState === ConnectionState.Disconnected,
    });
    return mergedProps;
  }, [room, props, connectionState]);

  return { buttonProps };
}

/**
 * The DisconnectButton is a basic html button with the added ability to disconnect from a LiveKit room.
 * Normally, it is used by end-users to leave a video or audio call.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <DisconnectButton>Leave room</DisconnectButton>
 * </LiveKitRoom>
 * ```
 * @public
 */
export function DisconnectButton(props: DisconnectButtonProps) {
  const { buttonProps } = useDisconnectButton(props);
  return <button {...buttonProps}>{props.children}</button>;
}
