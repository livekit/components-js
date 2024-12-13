import * as React from 'react';
import { useAddMemberButton } from '../../hooks/useAddMemberButton';
export interface AddMemberButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const AddMemberButton: (
  props: AddMemberButtonProps & React.RefAttributes<HTMLButtonElement>,
) => React.ReactNode = /* @__PURE__ */ React.forwardRef<HTMLButtonElement, AddMemberButtonProps>(
  function AddMemberButton(props: AddMemberButtonProps, ref) {
    const { buttonProps } = useAddMemberButton(props);

    return (
      <button ref={ref} {...buttonProps}>
        {props.children}
      </button>
    );
  },
);
