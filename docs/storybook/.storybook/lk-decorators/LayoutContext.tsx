import * as React from 'react';
import { Decorator } from '@storybook/react-vite';
import {
  LayoutContextProvider,
  useParticipants,
  useLayoutContext,
} from '@livekit/components-react';
import { Track } from 'livekit-client';

export type LkFocusContextProps = {
  hasFocus: boolean;
};

/**
 * Wraps a Storybook Story into a focus context.
 *
 * Note: This component requires some environment variables. Make sure that they are set correctly in your .env file.
 */
export const LkLayoutContext: Decorator = (Story, args) => {
  const hasFocus = (args.args as LkFocusContextProps).hasFocus;

  return (
    <LayoutContextProvider>
      <ContextWrapper hasFocus={hasFocus}>{Story()}</ContextWrapper>
    </LayoutContextProvider>
  );
};

const ContextWrapper = ({
  hasFocus: inFocus,
  children,
}: React.PropsWithChildren<{ hasFocus: boolean }>) => {
  const { dispatch } = useLayoutContext().pin;

  const participants = useParticipants();
  React.useEffect(() => {
    if (dispatch) {
      if (inFocus) {
        const participant = participants[0];
        if (participant) {
          const track = participant.getTrackPublication(Track.Source.Camera)!;
          dispatch({
            msg: 'set_pin',
            trackReference: { participant, source: track.source, publication: track },
          });
        }
      } else {
        dispatch({ msg: 'clear_pin' });
      }
    }
  }, [inFocus, dispatch, participants]);

  return <>{children}</>;
};
