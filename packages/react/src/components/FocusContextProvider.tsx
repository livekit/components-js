import { FocusState } from '@livekit/components-core';
import { Track } from 'livekit-client';
import * as React from 'react';
import { FocusAction, FocusContext, useRoomContext } from '../contexts';
import { useScreenShare } from './ScreenShareRenderer';

function focusReducer(state: FocusState, action: FocusAction): FocusState {
  console.log(`pinReducer msg:`, action);
  if (action.msg === 'set_focus') {
    return {
      ...state,
      participantInFocus: action.participant,
      trackInFocus: action.source,
    };
  } else if (action.msg === 'clear_focus') {
    return { ...state, participantInFocus: undefined, trackInFocus: undefined };
  } else {
    return { ...state };
  }
}

type FocusContextProviderProps = {
  children?: React.ReactNode | React.ReactNode[];
  onChange?: (pinState: FocusState) => void;
};

// TODO: Remove the screen sharing handling from this component to separate things.
export const FocusContextProvider = ({ onChange, children }: FocusContextProviderProps) => {
  const room = useRoomContext();
  const pinDefaultValue: FocusState = { participantInFocus: undefined, trackInFocus: undefined };
  const [pinState, pinDispatch] = React.useReducer(focusReducer, pinDefaultValue);
  const pinContextDefault = { dispatch: pinDispatch, state: pinState };
  const { screenShareParticipant } = useScreenShare({ room });
  React.useEffect(() => {
    // FIXME: This logic clears the focus if the screenShareParticipant is false.
    // This is also the case when the hook is executed for the first time and then a unwanted clear_focus message is sent.
    if (screenShareParticipant) {
      pinDispatch({
        msg: 'set_focus',
        participant: screenShareParticipant,
        source: Track.Source.ScreenShare,
      });
    } else {
      pinDispatch({ msg: 'clear_focus' });
    }
  }, [screenShareParticipant]);

  React.useEffect(() => {
    if (onChange) onChange(pinState);
  }, [onChange, pinState]);

  return <FocusContext.Provider value={pinContextDefault}>{children}</FocusContext.Provider>;
};
