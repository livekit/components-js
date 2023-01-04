import * as React from 'react';
import { Decorator } from '@storybook/react';
import { PinContextProvider, useParticipants, usePinContext } from '@livekit/components-react';
import { Track } from 'livekit-client';

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
  const { dispatch } = usePinContext();

  const participants = useParticipants();
  React.useEffect(() => {
    if (dispatch) {
      if (inFocus) {
        const participant = participants[0];
        if (participant) {
          const track = participant.getTrack(Track.Source.Camera)!;
          dispatch({ msg: 'set_pin', trackParticipantPair: { participant, track } });
        }
      } else {
        dispatch({ msg: 'clear_pin' });
      }
    }
  }, [inFocus, dispatch, participants]);

  return <>{children}</>;
};
