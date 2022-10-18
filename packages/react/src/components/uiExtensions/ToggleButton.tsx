import { mergeProps } from 'react-aria';
import React, { HTMLAttributes, useEffect, useState } from 'react';
import { lkClassName } from '@livekit/components-core';

export interface ToggleProps extends Omit<HTMLAttributes<HTMLButtonElement>, 'onChange'> {
  toggle?: () => void;
  onChange?: (enabled: boolean) => void;
  state?: boolean;
}

export const useToggle = ({ onChange, state, ...rest }: ToggleProps) => {
  const [isEnabled, setIsEnabled] = useState(!!state);
  useEffect(() => {
    if (state !== undefined) {
      setIsEnabled(state);
    }
  }, [state]);
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
