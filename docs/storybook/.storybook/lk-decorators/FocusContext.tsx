import React, { useEffect, useMemo } from 'react';
import { Decorator } from '@storybook/react';
import { PinContextProvider, TrackSource, usePinContext } from '@livekit/components-react';
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
  const isPinned = args.args.isPinned;

  const ContextWrapper = () => {
    const { dispatch } = usePinContext();
    const dummyParticipant = useMemo(() => {
      return new Participant('dummy-sid', 'dummy-identity');
    }, []);
    useEffect(() => {
      if (dispatch) {
        if (isPinned) {
          dispatch({ msg: 'set_pin', participant: dummyParticipant, source: TrackSource.Camera });
        } else {
          dispatch({ msg: 'clear_pin' });
        }
      }
    }, [dispatch, isPinned]);
    return Story();
  };

  return (
    <PinContextProvider>
      <ContextWrapper />
    </PinContextProvider>
  );
};
