import { ConnectionState, type Room } from 'livekit-client';
import { setupDisconnectButton } from '@livekit/components-core';
import React, { HTMLAttributes, useMemo } from 'react';
import { useRoomContext } from '../../contexts';
import { useConnectionState } from '../ConnectionState';
import { mergeProps } from '../../utils';

type DisconnectButtonProps = HTMLAttributes<HTMLButtonElement> & {
  room?: Room;
  stopTracks?: boolean;
};

export const useDisconnectButton = (props: DisconnectButtonProps) => {
  const currentRoom = props.room ?? useRoomContext();
  const connectionState = useConnectionState(currentRoom);

  const buttonProps = useMemo(() => {
    const { className, disconnect } = setupDisconnectButton(currentRoom);
    const mergedProps = mergeProps(props, {
      className,
      onClick: () => disconnect(props.stopTracks ?? true),
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
