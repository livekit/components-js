import * as React from 'react';
import { Decorator } from '@storybook/react';
import { FocusContextProvider, TrackSource, useFocusContext } from '@livekit/components-react';
import { Participant } from 'livekit-client';

export type LkFocusContextProps = {
  hasFocus: boolean;
};

/**
 * Wraps a Storybook Story into a focus context.
 *
 * Note: This component requires some environment variables. Make sure that they are set correctly in your .env file.
 */
export const LkFocusContext: Decorator = (Story, args) => {
  const inFocus = args.args.inFocus;

  const ContextWrapper = () => {
    const { dispatch } = useFocusContext();
    const dummyParticipant = React.useMemo(() => {
      return new Participant('dummy-sid', 'dummy-identity');
    }, []);
    React.useEffect(() => {
      if (dispatch) {
        if (inFocus) {
          dispatch({ msg: 'set_focus', participant: dummyParticipant, source: TrackSource.Camera });
        } else {
          dispatch({ msg: 'clear_focus' });
        }
      }
    }, [dispatch, inFocus]);
    return Story();
  };

  return (
    <FocusContextProvider>
      <ContextWrapper />
    </FocusContextProvider>
  );
};
