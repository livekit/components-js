import { setupClearPinButton } from '@livekit/components-core';
import * as React from 'react';
import { useLayoutContext } from '../context';
import { mergeProps } from '../mergeProps';
import type { ClearPinButtonProps } from '../components';

/**
 * The `useClearPinButton` hook provides props for the {@link ClearPinButton}
 * or your custom implementation of it component. It adds the `onClick` handler
 * to signal the `LayoutContext` that the tile in focus should be cleared.
 * @public
 */
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
