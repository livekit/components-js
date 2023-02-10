import { createPinStateObservable, PinState } from '@livekit/components-core';
import type { BehaviorSubject } from 'rxjs';

export type PinContextType = {
  observable: BehaviorSubject<PinState>;
};

export function createPinContext(initialState: PinState) {
  return createPinStateObservable(initialState);
}
