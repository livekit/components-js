import { createIsSpeakingObserver } from '@livekit/components-core';
import { Participant } from 'livekit-client';
import * as React from 'react';
import { useEnsureParticipant } from '../context';
import { useObservableState } from '../helper';

export function useIsSpeaking(participant?: Participant) {
  const p = useEnsureParticipant(participant);
  const observable = React.useMemo(() => createIsSpeakingObserver(p), [p]);
  const isSpeaking = useObservableState(observable, p.isSpeaking);

  return isSpeaking;
}
