import * as React from 'react';
import { useDisconnectButton } from '../../hooks';

/** @public */
export interface DisconnectButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  stopTracks?: boolean;
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
