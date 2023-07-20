import { setupDisconnectButton } from '@livekit/components-core';
import { ConnectionState } from 'livekit-client';
import * as React from 'react';
import type { DisconnectButtonProps } from '../components';
import { useRoomContext } from '../context';
import { mergeProps } from '../mergeProps';
import { useConnectionState } from './useConnectionStatus';

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
