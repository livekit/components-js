import { setupClearPinButton } from '@livekit/components-core';
import * as React from 'react';
import { useLayoutContext } from '../context';
import { mergeProps } from '../mergeProps';
import type { ClearPinButtonProps } from '../components';

/** @public */
export function useClearPinButton(props: ClearPinButtonProps) {
  const { state, dispatch } = useLayoutContext().pin;

  const buttonProps = React.useMemo(() => {
    const { className } = setupClearPinButton();
    const mergedProps = mergeProps(props, {
      className,
      disabled: !state?.length,
      onClick: () => {
        if (dispatch) dispatch({ msg: 'clear_pin' });
      },
    });
    return mergedProps;
  }, [props, dispatch, state]);

  return { buttonProps };
}
