import * as React from 'react';
import { Decorator } from '@storybook/react';
import { PinContextProvider, usePinContext } from '@livekit/components-react';

export type LkFocusContextProps = {
  hasFocus: boolean;
};

/**
 * Wraps a Storybook Story into a focus context.
 *
 * Note: This component requires some environment variables. Make sure that they are set correctly in your .env file.
 */
export const LkPinContext: Decorator = (Story, args) => {
  const hasFocus = (args.args as LkFocusContextProps).hasFocus;

  return (
    <PinContextProvider>
      <ContextWrapper hasFocus={hasFocus}>{Story()}</ContextWrapper>
    </PinContextProvider>
  );
};

const ContextWrapper = ({
  hasFocus: inFocus,
  children,
}: React.PropsWithChildren<{ hasFocus: boolean }>) => {
  const { dispatch, state } = usePinContext();
  React.useEffect(() => {
    if (dispatch) {
      if (inFocus) {
        // TODO: Pin a dummy participant on start.
        // dispatch({ msg: 'set_pin', trackParticipantPair: dummyPair });
      } else {
        dispatch({ msg: 'clear_pin' });
      }
    }
  }, [inFocus, dispatch, state]);

  return <>{children}</>;
};
