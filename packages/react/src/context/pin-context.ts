import type { PinState, TrackReferenceOrPlaceholder } from '@livekit/components-core';
import type * as React from 'react';

/** @internal */
export type PinAction =
  | {
      msg: 'set_pin';
      trackReference: TrackReferenceOrPlaceholder;
    }
  | { msg: 'clear_pin' };

/** @internal */
export type PinContextType = {
  dispatch?: React.Dispatch<PinAction>;
  state?: PinState;
};

/** @internal */
export function pinReducer(state: PinState, action: PinAction): PinState {
  if (action.msg === 'set_pin') {
    return [action.trackReference];
  } else if (action.msg === 'clear_pin') {
    return [];
  } else {
    return { ...state };
  }
}
