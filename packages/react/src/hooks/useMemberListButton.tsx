import * as React from 'react';
import { mergeProps } from '../utils';
import { MemberListButtonProps } from '../components/controls/MemberListButton';
import { setupMemberListButton } from '@livekit/components-core';

export function useMemberListButton(props: MemberListButtonProps) {
  const buttonProps = React.useMemo(() => {
    const { className } = setupMemberListButton();

    const mergedProps = mergeProps(props, {
      className,
    });
    return mergedProps;
  }, [props]);

  return { buttonProps };
}
