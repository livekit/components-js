import { PinState, TrackParticipantPair } from '@livekit/components-core';
import React from 'react';

export type PinAction =
  | {
      msg: 'set_pin';
      trackParticipantPair: TrackParticipantPair;
    }
  | { msg: 'clear_pin' };

export function isPinContextAction(action: { msg: string }): action is PinAction {
  return (action as PinAction).msg === 'set_pin' || (action as PinAction).msg === 'clear_pin';
}

export type PinContextType = {
  dispatch?: React.Dispatch<PinAction>;
  state?: PinState;
};

export function pinReducer(state: PinState, action: PinAction): PinState {
  if (action.msg === 'set_pin') {
    return [action.trackParticipantPair];
  } else if (action.msg === 'clear_pin') {
    return [];
  } else {
    return { ...state };
  }
}

export const PinContext = React.createContext<PinContextType>({});

export function usePinContext() {
  const pinContext = React.useContext(PinContext);
  if (!pinContext) {
    throw Error('tried to access focus context outside of focus context provider');
  }
  return pinContext;
}

export function useMaybePinContext() {
  return React.useContext(PinContext);
}
