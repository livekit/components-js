import { setupClearFocusButton } from '@livekit/components-core';
import * as React from 'react';
import { mergeProps } from '../utils';
import { usePinContext } from '../contexts';

export type ClearFocusButtonProps = React.HTMLAttributes<HTMLButtonElement>;

export const useClearFocusButton = (props: ClearFocusButtonProps) => {
  const { state, dispatch } = usePinContext();

  React.useEffect(() => {
    console.log({ state });
  }, [state]);

  const buttonProps = React.useMemo(() => {
    const { className } = setupClearFocusButton();
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
};

/**
 * The ClearFocusButton is a basic html button with the added ability to signal
 * the LiveKitRoom that it should display the grid view again.
 *
 * @remarks
 * This component works only inside a PinContext.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <ClearFocusButton>Leave room</ClearFocusButton>
 * </LiveKitRoom>
 * ```
 */
export const ClearFocusButton = (props: ClearFocusButtonProps) => {
  const { buttonProps } = useClearFocusButton(props);
  return <button {...buttonProps}>{props.children}</button>;
};
