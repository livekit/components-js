import { Participant, ParticipantEvent, ConnectionQuality } from 'livekit-client';
import { observeParticipantEvents } from '../observables/participant';
// import { getCSSClassName } from '../utils';
import type { BaseSetupReturnType } from './types';
import { map } from 'rxjs';

interface SetupConnectionQuality extends BaseSetupReturnType {
  /**
   *
   */
  onConnectionQualityChange: (
    participant: Participant,
    callback: (quality: ConnectionQuality) => void,
  ) => () => void;
}

export function setupConnectionQualityIndicator(): SetupConnectionQuality {
  const connectionQualityListener = (
    participant: Participant,
    callback: (quality: ConnectionQuality) => void,
  ) => {
    const listener = observeParticipantEvents(
      participant,
      ParticipantEvent.ConnectionQualityChanged,
    )
      .pipe(map((p) => p.connectionQuality))
      .subscribe((quality) => {
        callback(quality);
      });

    return () => listener.unsubscribe();
  };

  return {
    className: 'lk-connection-quality',
    onConnectionQualityChange: connectionQualityListener,
  }; // TODO: add class prefix back
}
