import * as React from 'react';
import { mergeProps } from '../utils';
import { AddMemberButtonProps } from '../components/controls/AddMemberButton';
import { setupAddMemberButton } from '@cc-livekit/components-core';

export function useAddMemberButton(props: AddMemberButtonProps) {
  const buttonProps = React.useMemo(() => {
    const { className } = setupAddMemberButton();

    const mergedProps = mergeProps(props, {
      className,
    });
    return mergedProps;
  }, [props]);

  return { buttonProps };
}
