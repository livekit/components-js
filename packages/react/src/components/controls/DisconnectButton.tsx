import { ConnectionState, type Room } from 'livekit-client';
import { setupDisconnectButton } from '@livekit/components-core';
import React, { HTMLAttributes, useMemo } from 'react';
import { useRoomContext } from '../../contexts';
import { useConnectionState } from '../ConnectionState';
import { mergeProps } from '../../utils';

type DisconnectButtonProps = HTMLAttributes<HTMLButtonElement> & {
  stopTracks?: boolean;
};

export const useDisconnectButton = (props: DisconnectButtonProps) => {
  const room = useRoomContext();
  const connectionState = useConnectionState(room);

  const buttonProps = useMemo(() => {
    const { className, disconnect } = setupDisconnectButton(room);
    const mergedProps = mergeProps(props, {
      className,
      onClick: () => disconnect(props.stopTracks ?? true),
      disabled: connectionState === ConnectionState.Disconnected,
    });
    return mergedProps;
  }, [room, connectionState]);

  return { buttonProps };
};

export const DisconnectButton = (props: DisconnectButtonProps) => {
  const { buttonProps } = useDisconnectButton(props);
  return <button {...buttonProps}>{props.children}</button>;
};
