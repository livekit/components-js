import { PinState } from '@livekit/components-core';
import { Track } from 'livekit-client';
import * as React from 'react';
import { PinAction, PinContext, useRoomContext } from '../contexts';
import { useScreenShare } from './ScreenShareRenderer';

function pinReducer(state: PinState, action: PinAction): PinState {
  console.log(`pinReducer msg:`, action);
  if (action.msg === 'set_pin') {
    return {
      ...state,
      pinnedParticipant: action.participant,
      pinnedSource: action.source,
    };
  } else if (action.msg === 'clear_pin') {
    return { ...state, pinnedParticipant: undefined, pinnedSource: undefined };
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
  const pinDefaultValue: PinState = { pinnedParticipant: undefined, pinnedSource: undefined };
  const [pinState, pinDispatch] = React.useReducer(pinReducer, pinDefaultValue);
  const pinContextDefault = { dispatch: pinDispatch, state: pinState };
  const { screenShareParticipant } = useScreenShare({ room });
  React.useEffect(() => {
    // FIXME: This logic clears the focus if the screenShareParticipant is false.
    // This is also the case when the hook is executed for the first time and then a unwanted clear_focus message is sent.
    if (screenShareParticipant) {
      pinDispatch({
        msg: 'set_pin',
        participant: screenShareParticipant,
        source: Track.Source.ScreenShare,
      });
    } else {
      pinDispatch({ msg: 'clear_pin' });
    }
  }, [screenShareParticipant]);

  React.useEffect(() => {
    if (onChange) onChange(pinState);
  }, [onChange, pinState]);

  return <PinContext.Provider value={pinContextDefault}>{children}</PinContext.Provider>;
}
