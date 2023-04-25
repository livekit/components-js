import { setupClearPinButton } from '@livekit/components-core';
import * as React from 'react';
import { mergeProps } from '../../utils';
import { useLayoutContext } from '../../context';

/** @public */
export type ClearPinButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

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

/**
 * The ClearPinButton is a basic html button with the added ability to signal
 * the LiveKitRoom that it should display the grid view again.
 *
 * @remarks
 * This component works only inside a PinContext.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <ClearPinButton>Leave room</ClearPinButton>
 * </LiveKitRoom>
 * ```
 * @public
 */
export function ClearPinButton(props: ClearPinButtonProps) {
  const { buttonProps } = useClearPinButton(props);
  return <button {...buttonProps}>{props.children}</button>;
}
