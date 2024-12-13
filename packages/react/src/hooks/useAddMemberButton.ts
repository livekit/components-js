import * as React from 'react';
import { useRoomContext } from '../context';
import { mergeProps } from '../utils';
import { AddMemberButtonProps } from '../components/controls/AddMemberButton';
import { setupAddMemberButton } from '@livekit/components-core';

export function useAddMemberButton(props: AddMemberButtonProps) {
  const room = useRoomContext();

  const buttonProps = React.useMemo(() => {
    const { className } = setupAddMemberButton();

    const mergedProps = mergeProps(props, {
      className,
    });
    return mergedProps;
  }, [room, props]);

  return { buttonProps };
}
