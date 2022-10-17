import { Track } from 'livekit-client';
import React, { ReactNode, useEffect, useReducer } from 'react';
import { PinAction, PinContext, PinState, useRoomContext } from '../contexts';
import { useScreenShare } from './ScreenShareRenderer';

function pinReducer(state: PinState, action: PinAction): PinState {
  console.log(`pinReducer msg:`, action);
  if (action.msg === 'set_pin') {
    return {
      ...state,
      pinnedParticipant: action.participant,
      pinnedTrackSource: action.source,
    };
  } else if (action.msg === 'clear_pin') {
    return { ...state, pinnedParticipant: undefined, pinnedTrackSource: undefined };
  } else {
    return { ...state };
  }
}

export function createNewPinContext() {
  const pinDefaultValue = { pinnedParticipant: undefined };
  const [pinState, pinDispatch] = useReducer(pinReducer, pinDefaultValue);
  const pinContextValue = { dispatch: pinDispatch, state: pinState };
  return pinContextValue;
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
  const { screenShareParticipant } = useScreenShare({ room });
  useEffect(() => {
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

  useEffect(() => {
    if (onChange) onChange(pinState);
  }, [pinState]);

  return <PinContext.Provider value={pinContextDefault}>{children}</PinContext.Provider>;
};
