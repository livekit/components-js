import * as React from 'react';
import { useMemberListButton } from '../../hooks/useMemberListButton';
export interface MemberListButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const MemberListButton: (
  props: MemberListButtonProps & React.RefAttributes<HTMLButtonElement>,
) => React.ReactNode = /* @__PURE__ */ React.forwardRef<HTMLButtonElement, MemberListButtonProps>(
  function MemberListButton(props: MemberListButtonProps, ref) {
    const { buttonProps } = useMemberListButton(props);

    return (
      <button ref={ref} {...buttonProps}>
        {props.children}
      </button>
    );
  },
);
