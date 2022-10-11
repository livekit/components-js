import React, { ReactNode, useEffect, useReducer } from 'react';
import { PinAction, PinContext, PinState } from '../contexts';

function pinReducer(state: PinState, action: PinAction): PinState {
  console.log(`pinReducer msg:`, action);
  if (action.msg === 'pinned_participant_was_set') {
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
  } else if (action.msg === 'focus_was_cleared') {
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
  const pinDefaultValue = { pinnedParticipant: undefined };
  const [pinState, pinDispatch] = useReducer(pinReducer, pinDefaultValue);
  const pinContextDefault = { dispatch: pinDispatch, state: pinState };

  useEffect(() => {
    if (onChange) onChange(pinState);
  }, [pinState]);

  return <PinContext.Provider value={pinContextDefault}>{children}</PinContext.Provider>;
};
