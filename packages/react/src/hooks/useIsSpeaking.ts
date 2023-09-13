import { createIsSpeakingObserver } from '@livekit/components-core';
import type { Participant } from 'livekit-client';
import * as React from 'react';
import { useEnsureParticipant } from '../context';
import { useObservableState } from './internal';

/**
 * The `useIsSpeaking` hook returns a `boolean` that indicates if the participant is speaking or not.
 * @example
 * ```tsx
 * const isSpeaking = useIsSpeaking(participant);
 * ```
 * @public
 */
export function useIsSpeaking(participant?: Participant) {
  const p = useEnsureParticipant(participant);
  const observable = React.useMemo(() => createIsSpeakingObserver(p), [p]);
  const isSpeaking = useObservableState(observable, p.isSpeaking);

  return isSpeaking;
}
