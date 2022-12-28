import { PinState } from '@livekit/components-core';
import * as React from 'react';
import { PinAction, PinContext, useRoomContext } from '../contexts';
import { useScreenShare } from './ScreenShareRenderer';

export function pinReducer(state: PinState, action: PinAction): PinState {
  console.log(`pinReducer msg: ${action.msg}`, { action }, { state });
  if (action.msg === 'set_pin') {
    return [action.trackParticipantPair];
  } else if (action.msg === 'clear_pin') {
    return [];
  } else {
    return { ...state };
  }
}

type PinContextProviderProps = {
  onChange?: (pinState: PinState) => void;
};

// TODO: Remove the screen sharing handling from this component to separate things.
export function PinContextProvider({
  onChange,
  children,
}: React.PropsWithChildren<PinContextProviderProps>) {
  const room = useRoomContext();
  const [pinState, pinDispatch] = React.useReducer(pinReducer, []);
  const pinContextDefault = { dispatch: pinDispatch, state: pinState };
  const { screenShareParticipant, screenShareTrack } = useScreenShare({ room });
  React.useEffect(() => {
    // FIXME: This logic clears the focus if the screenShareParticipant is false.
    // This is also the case when the hook is executed for the first time and then a unwanted clear_focus message is sent.
    if (screenShareParticipant && screenShareTrack) {
      pinDispatch({
        msg: 'set_pin',
        trackParticipantPair: { track: screenShareTrack, participant: screenShareParticipant },
      });
    } else {
      pinDispatch({ msg: 'clear_pin' });
    }
  }, [screenShareParticipant, screenShareTrack]);

  React.useEffect(() => {
    if (onChange) onChange(pinState);
  }, [onChange, pinState]);

  return <PinContext.Provider value={pinContextDefault}>{children}</PinContext.Provider>;
}
