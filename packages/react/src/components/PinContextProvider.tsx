import React, { ReactNode, useEffect, useReducer } from 'react';
import { PinAction, PinContext, PinState, useRoomContext } from '../contexts';
import { useScreenShare } from './ScreenShareRenderer';

function pinReducer(state: PinState, action: PinAction): PinState {
  console.log(`pinReducer msg:`, action);
  if (action.msg === 'set_pin') {
    if (
      state.pinnedParticipant?.identity === action.participant.identity &&
      state.pinnedTrackSource === action.source
    ) {
      return { ...state, pinnedParticipant: undefined, pinnedTrackSource: undefined };
    } else {
      return {
        ...state,
        pinnedParticipant: action.participant,
        pinnedTrackSource: action.source,
      };
    }
  } else if (action.msg === 'clear_pin') {
    return { ...state, pinnedParticipant: undefined };
  } else {
    return { ...state };
  }
}

type PinContextProviderProps = {
  children?: ReactNode | ReactNode[];
  onChange?: (pinState: PinState) => void;
};

export const PinContextProvider = ({ onChange, children }: PinContextProviderProps) => {
  const room = useRoomContext();
  const pinDefaultValue = { pinnedParticipant: undefined };
  const [pinState, pinDispatch] = useReducer(pinReducer, pinDefaultValue);
  const pinContextDefault = { dispatch: pinDispatch, state: pinState };
  const { allScreenShares } = useScreenShare({ room });
  useEffect(() => {
    // Clear pin state if screen share track stopped or is gone.
    if (
      !allScreenShares.some(({ participant }) => {
        const participantExists = participant.identity === pinState.pinnedParticipant?.identity;
        return participantExists && participant.isScreenShareEnabled;
      })
    ) {
      pinDispatch({ msg: 'clear_pin' });
    }
  }, [allScreenShares]);

  useEffect(() => {
    if (onChange) onChange(pinState);
  }, [pinState]);

  return <PinContext.Provider value={pinContextDefault}>{children}</PinContext.Provider>;
};
