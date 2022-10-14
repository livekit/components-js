import { mergeProps } from 'react-aria';
import React, { HTMLAttributes, useEffect, useState } from 'react';
import { lkClassName } from '@livekit/components-core';

export interface ToggleProps extends Omit<HTMLAttributes<HTMLButtonElement>, 'onChange'> {
  toggle?: () => void;
  onChange?: (enabled: boolean) => void;
  initialState?: boolean;
}

export const useToggle = ({ onChange, initialState, ...rest }: ToggleProps) => {
  const [isEnabled, setIsEnabled] = useState(!!initialState);

  useEffect(() => {
    onChange?.(isEnabled);
  }, [isEnabled]);

  const buttonProps = mergeProps(rest, {
    onClick: () => setIsEnabled(!isEnabled),
    'aria-pressed': isEnabled,
    className: lkClassName('button'),
  });

  return { buttonProps };
};

export function ToggleButton(props: ToggleProps) {
  const { buttonProps } = useToggle(props);
  return <button {...buttonProps}>{props.children}</button>;
}
