import { setupExitFocusViewButton } from '@livekit/components-core';
import * as React from 'react';
import { mergeProps } from '../utils';
import { usePinContext } from '../contexts';

export type ExitFocusViewButtonProps = React.HTMLAttributes<HTMLButtonElement>;

export const useExitFocusViewButton = (props: ExitFocusViewButtonProps) => {
  const { state, dispatch } = usePinContext();

  React.useEffect(() => {
    console.log({ state });
  }, [state]);

  const buttonProps = React.useMemo(() => {
    const { className } = setupExitFocusViewButton();
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
 * The ExitFocusViewButton is a basic html button with the added ability to signal
 * the LiveKitRoom that it should display the grid view again.
 *
 * @remarks
 * This component works only inside a PinContext.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <ExitFocusViewButton>Leave room</ExitFocusViewButton>
 * </LiveKitRoom>
 * ```
 */
export const ExitFocusViewButton = (props: ExitFocusViewButtonProps) => {
  const { buttonProps } = useExitFocusViewButton(props);
  return <button {...buttonProps}>{props.children}</button>;
};
