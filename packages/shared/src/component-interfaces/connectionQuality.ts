import { Participant, ParticipantEvent, ConnectionQuality } from 'livekit-client';
import { observeParticipantEvents } from '../observables/participant';
// import { getCSSClassName } from '../utils';
import type { BaseSetupReturnType } from './types';
import { map, Observable, startWith } from 'rxjs';

interface SetupConnectionQuality extends BaseSetupReturnType {}
const setup = (): SetupConnectionQuality => {
  return {
    className: 'lk-connection-quality',
  };
};

interface ObserverSetups {
  createConnectionQualityObserver: (
    participant: Participant,
  ) => Observable<{ quality: ConnectionQuality; class_: string }>;
}
const observers = (): ObserverSetups => {
  const createConnectionQualityObserver = (participant: Participant) => {
    const observer = observeParticipantEvents(
      participant,
      ParticipantEvent.ConnectionQualityChanged,
    ).pipe(
      map((p) => {
        return { quality: p.connectionQuality, class_: `lk-${p.connectionQuality}` };
      }),
      startWith({
        quality: participant.connectionQuality,
        class_: `lk-${participant.connectionQuality}`,
      }),
    );
    return observer;
  };
  return { createConnectionQualityObserver };
};

export { setup, observers };
