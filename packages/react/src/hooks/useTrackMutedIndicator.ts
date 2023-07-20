import { setupTrackMutedIndicator } from '@livekit/components-core';
import type { Participant, Track } from 'livekit-client';
import * as React from 'react';
import { useEnsureParticipant } from '../context';
import { useObservableState } from './internal';

/** @public */
export interface UseTrackMutedIndicatorOptions {
  participant?: Participant;
}

/** @public */
export function useTrackMutedIndicator(
  source: Track.Source,
  options: UseTrackMutedIndicatorOptions = {},
) {
  const p = useEnsureParticipant(options.participant);
  const { className, mediaMutedObserver } = React.useMemo(
    () => setupTrackMutedIndicator(p, source),
    [p, source],
  );

  const isMuted = useObservableState(mediaMutedObserver, !!p.getTrack(source)?.isMuted);

  return { isMuted, className };
}
