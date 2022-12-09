import { setupClearPinButton } from '@livekit/components-core';
import * as React from 'react';
import { mergeProps } from '../utils';
import { usePinContext } from '../contexts';

export type ClearFocusButtonProps = React.HTMLAttributes<HTMLButtonElement>;

export function useClearPinButton(props: ClearFocusButtonProps) {
  const { state, dispatch } = usePinContext();

  React.useEffect(() => {
    console.log({ state });
  }, [state]);

  const buttonProps = React.useMemo(() => {
    const { className } = setupClearPinButton();
    const mergedProps = mergeProps(props, {
      className,
      disabled: state?.pinnedParticipant === undefined,
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
 */
export function ClearPinButton(props: ClearFocusButtonProps) {
  const { buttonProps } = useClearPinButton(props);
  return <button {...buttonProps}>{props.children}</button>;
}
