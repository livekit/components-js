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
      pinnedTrackSource: action.source,
    };
  } else if (action.msg === 'clear_pin') {
    return { ...state, pinnedParticipant: undefined, pinnedTrackSource: undefined };
  } else {
    return { ...state };
  }
}

type PinContextProviderProps = {
  children?: React.ReactNode | React.ReactNode[];
  onChange?: (pinState: PinState) => void;
};

export const PinContextProvider = ({ onChange, children }: PinContextProviderProps) => {
  const room = useRoomContext();
  const pinDefaultValue = { pinnedParticipant: undefined };
  const [pinState, pinDispatch] = React.useReducer(pinReducer, pinDefaultValue);
  const pinContextDefault = { dispatch: pinDispatch, state: pinState };
  const { screenShareParticipant } = useScreenShare({ room });
  React.useEffect(() => {
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
  }, [pinState]);

  return <PinContext.Provider value={pinContextDefault}>{children}</PinContext.Provider>;
};
