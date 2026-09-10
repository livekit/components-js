import { PinState, TrackReferenceOrPlaceholder } from '@livekit/components-core';
import type * as React from 'react';
/** @internal */
export type PinAction = {
    msg: 'set_pin';
    trackReference: TrackReferenceOrPlaceholder;
} | {
    msg: 'clear_pin';
};
/** @internal */
export type PinContextType = {
    dispatch?: React.Dispatch<PinAction>;
    state?: PinState;
};
/** @internal */
export declare function pinReducer(state: PinState, action: PinAction): PinState;
//# sourceMappingURL=pin-context.d.ts.map