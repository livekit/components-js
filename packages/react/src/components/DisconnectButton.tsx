import { ConnectionState, type Room } from 'livekit-client';
import { setupDisconnectButton } from '@livekit/components-core';
import React, { HTMLAttributes, useMemo } from 'react';
import { mergeProps } from 'react-aria';
import { useRoomContext } from '../contexts';
import { useConnectionState } from './ConnectionState';

type DisconnectButtonProps = HTMLAttributes<HTMLButtonElement> & {
  room?: Room;
};

export const useDisconnectButton = (props: DisconnectButtonProps) => {
  const currentRoom = props.room ?? useRoomContext();
  const connectionState = useConnectionState(currentRoom);

  const buttonProps = useMemo(() => {
    const { className, disconnect: onClick } = setupDisconnectButton(currentRoom);
    const mergedProps = mergeProps(props, {
      className,
      onClick,
      disabled: connectionState === ConnectionState.Disconnected,
    });
    return mergedProps;
  }, [currentRoom, connectionState]);

  return { buttonProps };
};

export const DisconnectButton = (props: DisconnectButtonProps) => {
  const { buttonProps } = useDisconnectButton(props);
  return <button {...buttonProps}>{props.children}</button>;
};
