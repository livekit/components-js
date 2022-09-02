import { Participant, ParticipantEvent, ConnectionQuality } from 'livekit-client';
import { observeParticipantEvents } from '../observables/participant';
// import { getCSSClassName } from '../utils';
import type { BaseSetupReturnType } from './types';
import { map, Observable } from 'rxjs';

interface SetupConnectionQuality extends BaseSetupReturnType {}
const setup = (): SetupConnectionQuality => {
  return {
    className: 'lk-connection-quality',
  };
};

interface ObserverSetups {
  createConnectionQualityObserver: (participant: Participant) => Observable<ConnectionQuality>;
}
const observers = (): ObserverSetups => {
  const createConnectionQualityObserver = (participant: Participant) => {
    const observer = observeParticipantEvents(
      participant,
      ParticipantEvent.ConnectionQualityChanged,
    ).pipe(map((p) => p.connectionQuality));
    return observer;
  };
  return { createConnectionQualityObserver };
};

export { setup, observers };
