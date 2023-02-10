import { BehaviorSubject } from 'rxjs';
import { PinState } from '../types';

export function createPinStateObservable(initialState: PinState) {
  return new BehaviorSubject(initialState);
}
