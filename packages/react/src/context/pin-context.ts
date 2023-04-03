import type { PinState, TrackReference } from '@livekit/components-core';
import type * as React from 'react';

export type PinAction =
  | {
      msg: 'set_pin';
      trackReference: TrackReference;
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
    return [action.trackReference];
  } else if (action.msg === 'clear_pin') {
    return [];
  } else {
    return { ...state };
  }
}
